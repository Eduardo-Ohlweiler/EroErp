package com.api.ero_api.tenant.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoCache;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.mapper.TenantMapper;
import com.api.ero_api.tenant.repository.TenantRepository;
import com.api.ero_api.tenant.util.DocumentoValidator;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contratantes. Tudo aqui é da plataforma (superadmin), exceto {@link #atual()}.
 * As escritas exigem o superadmin na visão de plataforma (fora de um contratante).
 */
@Service
public class TenantService {

    private static final Set<String> ORDENAVEIS = Set.of("nome", "createdAt");

    private final TenantRepository repository;
    private final UsuarioService usuarioService;
    private final AutorizacaoCache cache;
    private final EventoSegurancaService eventos;

    public TenantService(TenantRepository repository, UsuarioService usuarioService, AutorizacaoCache cache,
                         EventoSegurancaService eventos) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.cache = cache;
        this.eventos = eventos;
    }

    @Transactional(readOnly = true)
    public PaginaDto<TenantResponseDto> listar(String busca, Boolean ativo, Pageable pageable) {
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, Sort.by("nome"));
        String termo = busca == null || busca.isBlank() ? null : busca.trim();
        // Documento é gravado sem máscara: "12.345.678/0001-90" precisa achar "12345678000190".
        String normalizado = DocumentoValidator.normalizar(termo);
        String digitos = normalizado == null || normalizado.isEmpty() ? null : normalizado;
        return PaginaDto.de(repository.buscarComFiltros(TenantContext.ROOT, termo, digitos, ativo, pagina),
                TenantMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public List<TenantSelectDto> buscarParaSelecao() {
        return repository.buscarParaSelecao(TenantContext.ROOT).stream().map(TenantMapper::toSelectDto).toList();
    }

    @Transactional(readOnly = true)
    public TenantResponseDto buscarPorId(UUID id) {
        return TenantMapper.toResponseDto(buscarEntidade(id));
    }

    /** Para outros services (login, autorização). Inclui a Plataforma. */
    @Transactional(readOnly = true)
    public Tenant buscarEntidade(UUID id) {
        return repository.buscarPorId(id)
                .orElseThrow(() -> new NaoEncontradoException("Contratante não encontrado."));
    }

    /** Contratante em que o usuário logado está atuando (nome e cor para o front). */
    @Transactional(readOnly = true)
    public TenantAtualDto atual() {
        return TenantMapper.toAtualDto(buscarEntidade(SecurityUtils.getTenantIdLogado()));
    }

    @Transactional
    public TenantResponseDto criar(TenantCreateDto dto) {
        exigirVisaoPlataforma();
        Tenant t = TenantMapper.toEntity(dto);
        validarDocumento(t.getDocumento(), null);
        repository.saveAndFlush(t);
        usuarioService.criarAdminInicial(t.getId(), dto.administrador().nome(), dto.administrador().email(),
                dto.administrador().senha());
        // usuarioId = afetado (nenhum); quem fez fica em created_by do evento.
        eventos.registrar(TipoEventoSeguranca.TENANT_CRIADO, null, t.getId(), t.getNome());
        return TenantMapper.toResponseDto(t);
    }

    @Transactional
    public TenantResponseDto atualizar(UUID id, TenantUpdateDto dto) {
        exigirVisaoPlataforma();
        Tenant t = buscarContratante(id);
        if (!t.getVersion().equals(dto.version())) {
            throw new ConflitoException("Este contratante foi alterado por outra pessoa. Recarregue e tente de novo.");
        }
        String documento = DocumentoValidator.normalizar(dto.documento());
        validarDocumento(documento, t.getId());
        TenantMapper.atualizarEntidade(t, dto);
        repository.saveAndFlush(t);
        cache.invalidarTudo();
        eventos.registrar(TipoEventoSeguranca.TENANT_ALTERADO, null, t.getId(), null);
        return TenantMapper.toResponseDto(t);
    }

    @Transactional
    public void inativar(UUID id) {
        exigirVisaoPlataforma();
        Tenant t = buscarContratante(id);
        t.setAtivo(false);
        cache.invalidarTudo();
        eventos.registrar(TipoEventoSeguranca.TENANT_INATIVADO, null, t.getId(), t.getNome());
    }

    @Transactional
    public void ativar(UUID id) {
        exigirVisaoPlataforma();
        Tenant t = buscarContratante(id);
        t.setAtivo(true);
        cache.invalidarTudo();
        eventos.registrar(TipoEventoSeguranca.TENANT_ATIVADO, null, t.getId(), t.getNome());
    }

    /** Contratante real (nunca a Plataforma), para o superadmin acessar ou alterar. */
    @Transactional(readOnly = true)
    public Tenant buscarContratante(UUID id) {
        if (TenantContext.ROOT.equals(id)) {
            throw new NaoEncontradoException("Contratante não encontrado.");
        }
        return buscarEntidade(id);
    }

    /** CPF/CNPJ válido (dígito verificador) e sem outro contratante com o mesmo. */
    private void validarDocumento(String documento, UUID ignorarId) {
        if (documento != null && !DocumentoValidator.valido(documento)) {
            throw new RegraNegocioException("CPF ou CNPJ inválido.");
        }
        if (documento != null && repository.existeDocumento(documento, ignorarId == null ? TenantContext.NENHUM : ignorarId)) {
            throw new ConflitoException("Já existe um contratante com este documento.");
        }
    }

    private static void exigirVisaoPlataforma() {
        if (!TenantContext.ROOT.equals(SecurityUtils.getTenantIdLogado())) {
            throw new RegraNegocioException("Saia do contratante para gerenciar contratantes.");
        }
    }
}
