package com.api.ero_api.auxiliar.service;

import com.api.ero_api.auxiliar.dtos.CategoriaServicoCreateDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoResponseDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoSelectDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoUpdateDto;
import com.api.ero_api.auxiliar.entity.CategoriaServico;
import com.api.ero_api.auxiliar.mapper.CategoriaServicoMapper;
import com.api.ero_api.auxiliar.repository.CategoriaServicoRepository;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.ConflitoCampoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.compartilhado.util.RepetirSeCodigoRepetido;
import com.api.ero_api.compartilhado.util.RestricaoViolada;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Categorias de serviço do contratante (cadastro auxiliar do serviço; tela FormList).
 * Cópia do ProfissaoService sem itens do sistema (nada de {@code exigirDoContratante}:
 * todo item se edita, inativa e reativa).
 *
 * <ul>
 *   <li>todo método começa com {@code exigirTenantSelecionado()}: na visão de plataforma
 *       (ROOT) o filtro de tenant não vale e o maior + 1 pegaria o de todos;</li>
 *   <li>nome único no contratante sem caixa nem acento (409 com campo);</li>
 *   <li>{@link #criar} não leva {@code @Transactional}: cada tentativa do código roda na
 *       própria transação ({@link RepetirSeCodigoRepetido});</li>
 *   <li>"excluir" é inativar: não há DELETE físico de cadastro.</li>
 * </ul>
 */
@Service
public class CategoriaServicoService {

    private static final Set<String> ORDENAVEIS = Set.of("codCategoriaServico", "nome");
    private static final Sort ORDEM_PADRAO = Sort.by("nome");
    private static final String UK_CODIGO = "uk_categoria_servico_tenant_cod_categoria_servico";
    private static final String UK_NOME = "uk_categoria_servico_tenant_nome_busca";
    private static final String MSG_NAO_ENCONTRADO = "Categoria de serviço não encontrada.";
    private static final String MSG_NOME_REPETIDO = "Já existe uma categoria de serviço com este nome.";
    /** Toda rota exige um contratante selecionado: a resposta nunca é da visão de plataforma. */
    private static final boolean PLATAFORMA = false;

    private final CategoriaServicoRepository repository;
    private final UsuarioService usuarioService;
    private final RepetirSeCodigoRepetido repetir;

    public CategoriaServicoService(CategoriaServicoRepository repository, UsuarioService usuarioService,
                                   RepetirSeCodigoRepetido repetir) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.repetir = repetir;
    }

    // ---------------------------------------------------------------- leitura

    @Transactional(readOnly = true)
    public PaginaDto<CategoriaServicoResponseDto> listar(Pageable pageable) {
        SecurityUtils.exigirTenantSelecionado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, ORDEM_PADRAO);
        Page<CategoriaServico> itens = repository.buscarPagina(pagina);
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(itens.getContent()));
        return PaginaDto.de(itens, t -> CategoriaServicoMapper.toResponseDto(t, autores, PLATAFORMA));
    }

    @Transactional(readOnly = true)
    public List<CategoriaServicoSelectDto> listarParaSelecao(boolean inativos) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarParaSelecao(inativos).stream().map(CategoriaServicoMapper::toSelectDto).toList();
    }

    /**
     * Para outros services (a escolhida no serviço): várias de uma vez, filtradas pelo
     * tenant. Id de outro contratante ou inexistente fica fora do mapa.
     */
    @Transactional(readOnly = true)
    public Map<UUID, CategoriaServico> buscarPorIds(Collection<UUID> ids) {
        SecurityUtils.exigirTenantSelecionado();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.buscarPorIds(ids).stream()
                .collect(Collectors.toMap(CategoriaServico::getId, Function.identity()));
    }

    // ---------------------------------------------------------------- escrita

    /** Sem {@code @Transactional}: o código pode repetir e cada tentativa precisa da própria transação. */
    public CategoriaServicoResponseDto criar(CategoriaServicoCreateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        return repetir.executar(UK_CODIGO, () -> gravarNova(dto));
    }

    @Transactional
    public CategoriaServicoResponseDto atualizar(UUID id, CategoriaServicoUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        CategoriaServico t = buscarEntidade(id);
        if (!t.getVersion().equals(dto.version())) {
            throw new ConflitoException("Esta categoria de serviço foi alterada por outra pessoa. Recarregue e tente de novo.");
        }
        validarNomeLivre(TextoBusca.normalizar(dto.nome()), t.getId());
        CategoriaServicoMapper.atualizarEntidade(t, dto);
        salvar(t);
        return toResponseDto(t);
    }

    /** Já inativa: 204 sem fazer nada. A inativa some dos combos e continua nos serviços que a usam. */
    @Transactional
    public void inativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        buscarEntidade(id).setAtivo(false);
    }

    /** Já ativa: 204 sem fazer nada. */
    @Transactional
    public void ativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        buscarEntidade(id).setAtivo(true);
    }

    // ---------------------------------------------------------------- regras

    /**
     * Uma tentativa do {@link #criar}, já dentro da transação dela: remonta a entidade a
     * partir do DTO, valida e pede o código imediatamente antes de gravar.
     */
    private CategoriaServicoResponseDto gravarNova(CategoriaServicoCreateDto dto) {
        CategoriaServico t = CategoriaServicoMapper.toEntity(dto);
        validarNomeLivre(t.getNomeBusca(), TenantContext.NENHUM);
        t.setCodCategoriaServico(repository.buscarProximoCodigo());
        salvar(t);
        return toResponseDto(t);
    }

    /**
     * {@code saveAndFlush} para a resposta já sair com a {@code version} nova. Nome repetido
     * numa corrida (os dois passaram pelo {@link #validarNomeLivre}): o índice único segura
     * e vira o mesmo 409 com campo. O índice do código sobe como está, para o
     * {@link RepetirSeCodigoRepetido} tentar de novo.
     */
    private void salvar(CategoriaServico t) {
        try {
            repository.saveAndFlush(t);
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_NOME)) {
                throw new ConflitoCampoException("nome", MSG_NOME_REPETIDO);
            }
            throw e;
        }
    }

    private CategoriaServico buscarEntidade(UUID id) {
        return repository.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADO));
    }

    private void validarNomeLivre(String nomeBusca, UUID ignorarId) {
        if (repository.existeNome(nomeBusca, ignorarId)) {
            throw new ConflitoCampoException("nome", MSG_NOME_REPETIDO);
        }
    }

    /** Resposta de um registro só (criar, alterar), com os nomes da auditoria. */
    private CategoriaServicoResponseDto toResponseDto(CategoriaServico t) {
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(List.of(t)));
        return CategoriaServicoMapper.toResponseDto(t, autores, PLATAFORMA);
    }

    private static Set<UUID> idsDeAuditoria(Collection<CategoriaServico> itens) {
        Set<UUID> ids = new HashSet<>();
        itens.forEach(t -> Stream.of(t.getCreatedBy(), t.getUpdatedBy()).filter(Objects::nonNull).forEach(ids::add));
        return ids;
    }
}
