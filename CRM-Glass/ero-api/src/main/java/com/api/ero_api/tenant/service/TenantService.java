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
import com.api.ero_api.tenant.dtos.FundoCatalogoDto;
import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantConfiguracaoUpdateDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.enums.Fundo;
import com.api.ero_api.tenant.mapper.TenantMapper;
import com.api.ero_api.tenant.repository.TenantRepository;
import com.api.ero_api.tenant.util.DocumentoValidator;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
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
    private static final String MSG_CENA_DE_OUTRO = "Esta cena exclusiva já pertence a outro contratante.";
    private static final String UK_FUNDO_EXCLUSIVO = "uk_tenant_fundo_exclusivo";

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

    /** Contratante em que o usuário logado está atuando (nome e aparência para o front). */
    @Transactional(readOnly = true)
    public TenantAtualDto atual() {
        return TenantMapper.toAtualDto(buscarEntidade(SecurityUtils.getTenantIdLogado()));
    }

    /**
     * Nomes de vários contratantes numa consulta só (trilha de auditoria da plataforma).
     * Id que não existe simplesmente não aparece no mapa.
     */
    @Transactional(readOnly = true)
    public Map<UUID, String> buscarNomes(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.buscarNomesPorIds(ids).stream()
                .collect(Collectors.toMap(TenantSelectDto::id, TenantSelectDto::nome));
    }

    /**
     * Fundos que o contratante pode escolher: os comuns, as cenas exclusivas ainda
     * sem dono e a exclusiva que já é dele. Sem {@code tenantId} (contratante novo),
     * só os comuns e as exclusivas livres.
     */
    @Transactional(readOnly = true)
    public List<FundoCatalogoDto> listarFundos(UUID tenantId) {
        UUID ignorar = tenantId == null ? TenantContext.NENHUM : buscarContratante(tenantId).getId();
        Set<Fundo> emUso = Set.copyOf(repository.buscarFundosExclusivosEmUso(ignorar));
        return Arrays.stream(Fundo.values())
                .filter(f -> !f.exclusiva() || !emUso.contains(f))
                .map(TenantMapper::toFundoCatalogoDto)
                .toList();
    }

    @Transactional
    public TenantResponseDto criar(TenantCreateDto dto) {
        exigirVisaoPlataforma();
        Tenant t = TenantMapper.toEntity(dto);
        validarDocumento(t.getDocumento(), null);
        validarFundos(t, null);
        repository.saveAndFlush(t);
        usuarioService.criarAdminInicial(t.getId(), dto.administrador().nome(), dto.administrador().email(),
                dto.administrador().senha());
        // usuarioId = afetado (nenhum); quem fez fica em created_by do evento.
        eventos.registrar(TipoEventoSeguranca.TENANT_CRIADO, null, t.getId(), t.getNome());
        return TenantMapper.toResponseDto(t);
    }

    /** Só os dados cadastrais. A aparência muda em {@link #configurar}. */
    @Transactional
    public TenantResponseDto atualizar(UUID id, TenantUpdateDto dto) {
        exigirVisaoPlataforma();
        Tenant t = buscarContratante(id);
        exigirVersao(t, dto.version());
        String documento = DocumentoValidator.normalizar(dto.documento());
        validarDocumento(documento, t.getId());
        TenantMapper.atualizarEntidade(t, dto);
        repository.saveAndFlush(t);
        cache.invalidarTudo();
        eventos.registrar(TipoEventoSeguranca.TENANT_ALTERADO, null, t.getId(), null);
        return TenantMapper.toResponseDto(t);
    }

    /**
     * Aparência e cena exclusiva do contratante (tela Configuração). Vale para todos
     * os usuários dele no próximo {@code /api/auth/eu} ou renovação de sessão.
     * Não mexe no cache de autorização: ele não guarda aparência.
     */
    @Transactional
    public TenantResponseDto configurar(UUID id, TenantConfiguracaoUpdateDto dto) {
        exigirVisaoPlataforma();
        Tenant t = buscarContratante(id);
        exigirVersao(t, dto.version());
        TenantMapper.aplicarAparencia(t, dto.aparencia());
        t.setFundoExclusivo(dto.fundoExclusivo());
        validarFundos(t, t.getId());
        try {
            repository.saveAndFlush(t);
        } catch (DataIntegrityViolationException e) {
            // Dois superadmins vinculando a mesma cena ao mesmo tempo: o índice único segura.
            // Outra violação segue para o tratamento global (409 genérico).
            if (violou(e, UK_FUNDO_EXCLUSIVO)) {
                throw new ConflitoException(MSG_CENA_DE_OUTRO);
            }
            throw e;
        }
        eventos.registrar(TipoEventoSeguranca.TENANT_ALTERADO, null, t.getId(), "configuração");
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

    /**
     * Cena exclusiva: só cena marcada como exclusiva, e com um dono só. O fundo em
     * uso só pode ser exclusivo se for a cena exclusiva do próprio contratante.
     */
    private void validarFundos(Tenant t, UUID ignorarId) {
        Fundo exclusivo = t.getFundoExclusivo();
        if (exclusivo != null && !exclusivo.exclusiva()) {
            throw new RegraNegocioException("Esta cena não é exclusiva.");
        }
        if (exclusivo != null
                && repository.existeFundoExclusivo(exclusivo, ignorarId == null ? TenantContext.NENHUM : ignorarId)) {
            throw new ConflitoException(MSG_CENA_DE_OUTRO);
        }
        if (t.getFundo().exclusiva() && t.getFundo() != exclusivo) {
            throw new RegraNegocioException("Este fundo não está disponível para este contratante.");
        }
    }

    /** A violação veio da constraint indicada? (o Hibernate extrai o nome da mensagem do Postgres) */
    private static boolean violou(DataIntegrityViolationException e, String constraint) {
        for (Throwable c = e; c != null; c = c.getCause()) {
            if (c instanceof ConstraintViolationException cve && constraint.equalsIgnoreCase(cve.getConstraintName())) {
                return true;
            }
        }
        return false;
    }

    private static void exigirVersao(Tenant t, Long versaoVista) {
        if (!t.getVersion().equals(versaoVista)) {
            throw new ConflitoException("Este contratante foi alterado por outra pessoa. Recarregue e tente de novo.");
        }
    }

    private static void exigirVisaoPlataforma() {
        if (!TenantContext.ROOT.equals(SecurityUtils.getTenantIdLogado())) {
            throw new RegraNegocioException("Saia do contratante para gerenciar contratantes.");
        }
    }
}
