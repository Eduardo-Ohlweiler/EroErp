package com.api.ero_api.auxiliar.service;

import com.api.ero_api.auxiliar.dtos.TipoEnderecoCreateDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoResponseDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoSelectDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoUpdateDto;
import com.api.ero_api.auxiliar.entity.TipoEndereco;
import com.api.ero_api.auxiliar.mapper.TipoEnderecoMapper;
import com.api.ero_api.auxiliar.repository.TipoEnderecoRepository;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.ConflitoCampoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
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
 * Tipos de endereço do contratante (cadastro auxiliar; tela FormList). Cópia do
 * TipoCadastroService (o modelo dos 5 auxiliares), só com a troca de nomes.
 *
 * <ul>
 *   <li>todo método começa com {@code exigirTenantSelecionado()}: na visão de plataforma
 *       (ROOT) o filtro de tenant não vale e o maior + 1 pegaria o de todos;</li>
 *   <li>itens do sistema ({@code chave} preenchida) não se alteram, inativam nem ativam (422);</li>
 *   <li>nome único no contratante sem caixa nem acento, contando os do sistema (409 com campo);</li>
 *   <li>{@link #criar} não leva {@code @Transactional}: cada tentativa do código roda na
 *       própria transação ({@link RepetirSeCodigoRepetido});</li>
 *   <li>"excluir" é inativar: não há DELETE físico de cadastro.</li>
 * </ul>
 */
@Service
public class TipoEnderecoService {

    private static final Set<String> ORDENAVEIS = Set.of("codTipoEndereco", "nome");
    private static final Sort ORDEM_PADRAO = Sort.by("nome");
    private static final String UK_CODIGO = "uk_tipo_endereco_tenant_cod_tipo_endereco";
    private static final String UK_NOME = "uk_tipo_endereco_tenant_nome_busca";
    private static final String MSG_NAO_ENCONTRADO = "Tipo de endereço não encontrado.";
    private static final String MSG_NOME_REPETIDO = "Já existe um tipo de endereço com este nome.";
    private static final String MSG_ITEM_DO_SISTEMA = "Itens do sistema não podem ser alterados.";
    /** Toda rota exige um contratante selecionado: a resposta nunca é da visão de plataforma. */
    private static final boolean PLATAFORMA = false;

    private final TipoEnderecoRepository repository;
    private final UsuarioService usuarioService;
    private final RepetirSeCodigoRepetido repetir;

    public TipoEnderecoService(TipoEnderecoRepository repository, UsuarioService usuarioService,
                               RepetirSeCodigoRepetido repetir) {
        this.repository = repository;
        this.usuarioService = usuarioService;
        this.repetir = repetir;
    }

    // ---------------------------------------------------------------- leitura

    @Transactional(readOnly = true)
    public PaginaDto<TipoEnderecoResponseDto> listar(Pageable pageable) {
        SecurityUtils.exigirTenantSelecionado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, ORDEM_PADRAO);
        Page<TipoEndereco> tipos = repository.buscarPagina(pagina);
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(tipos.getContent()));
        return PaginaDto.de(tipos, t -> TipoEnderecoMapper.toResponseDto(t, autores, PLATAFORMA));
    }

    @Transactional(readOnly = true)
    public List<TipoEnderecoSelectDto> listarParaSelecao(boolean inativos) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarParaSelecao(inativos).stream().map(TipoEnderecoMapper::toSelectDto).toList();
    }

    /**
     * Para outros services (tipos escolhidos na pessoa): vários de uma vez, filtrados pelo
     * tenant. Id de outro contratante ou inexistente fica fora do mapa.
     */
    @Transactional(readOnly = true)
    public Map<UUID, TipoEndereco> buscarPorIds(Collection<UUID> ids) {
        SecurityUtils.exigirTenantSelecionado();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.buscarPorIds(ids).stream().collect(Collectors.toMap(TipoEndereco::getId, Function.identity()));
    }

    // ---------------------------------------------------------------- escrita

    /** Sem {@code @Transactional}: o código pode repetir e cada tentativa precisa da própria transação. */
    public TipoEnderecoResponseDto criar(TipoEnderecoCreateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        return repetir.executar(UK_CODIGO, () -> gravarNovo(dto));
    }

    @Transactional
    public TipoEnderecoResponseDto atualizar(UUID id, TipoEnderecoUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        TipoEndereco t = buscarEntidade(id);
        exigirDoContratante(t);
        if (!t.getVersion().equals(dto.version())) {
            throw new ConflitoException("Este tipo de endereço foi alterado por outra pessoa. Recarregue e tente de novo.");
        }
        validarNomeLivre(TextoBusca.normalizar(dto.nome()), t.getId());
        TipoEnderecoMapper.atualizarEntidade(t, dto);
        salvar(t);
        return toResponseDto(t);
    }

    /** Já inativo: 204 sem fazer nada. O item inativo some dos combos e continua nas pessoas que o usam. */
    @Transactional
    public void inativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        TipoEndereco t = buscarEntidade(id);
        exigirDoContratante(t);
        t.setAtivo(false);
    }

    /** Já ativo: 204 sem fazer nada. */
    @Transactional
    public void ativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        TipoEndereco t = buscarEntidade(id);
        exigirDoContratante(t);
        t.setAtivo(true);
    }

    // ---------------------------------------------------------------- regras

    /**
     * Uma tentativa do {@link #criar}, já dentro da transação dela: remonta a entidade a
     * partir do DTO, valida e pede o código imediatamente antes de gravar.
     */
    private TipoEnderecoResponseDto gravarNovo(TipoEnderecoCreateDto dto) {
        TipoEndereco t = TipoEnderecoMapper.toEntity(dto);
        validarNomeLivre(t.getNomeBusca(), TenantContext.NENHUM);
        t.setCodTipoEndereco(repository.buscarProximoCodigo());
        salvar(t);
        return toResponseDto(t);
    }

    /**
     * {@code saveAndFlush} para a resposta já sair com a {@code version} nova. Nome repetido
     * numa corrida (os dois passaram pelo {@link #validarNomeLivre}): o índice único segura
     * e vira o mesmo 409 com campo. O índice do código sobe como está, para o
     * {@link RepetirSeCodigoRepetido} tentar de novo.
     */
    private void salvar(TipoEndereco t) {
        try {
            repository.saveAndFlush(t);
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_NOME)) {
                throw new ConflitoCampoException("nome", MSG_NOME_REPETIDO);
            }
            throw e;
        }
    }

    private TipoEndereco buscarEntidade(UUID id) {
        return repository.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADO));
    }

    /** Item do sistema é imutável (o banco também confere que ele nunca fica inativo). */
    private static void exigirDoContratante(TipoEndereco t) {
        if (t.sistema()) {
            throw new RegraNegocioException(MSG_ITEM_DO_SISTEMA);
        }
    }

    private void validarNomeLivre(String nomeBusca, UUID ignorarId) {
        if (repository.existeNome(nomeBusca, ignorarId)) {
            throw new ConflitoCampoException("nome", MSG_NOME_REPETIDO);
        }
    }

    /** Resposta de um registro só (criar, alterar), com os nomes da auditoria. */
    private TipoEnderecoResponseDto toResponseDto(TipoEndereco t) {
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(List.of(t)));
        return TipoEnderecoMapper.toResponseDto(t, autores, PLATAFORMA);
    }

    private static Set<UUID> idsDeAuditoria(Collection<TipoEndereco> tipos) {
        Set<UUID> ids = new HashSet<>();
        tipos.forEach(t -> Stream.of(t.getCreatedBy(), t.getUpdatedBy()).filter(Objects::nonNull).forEach(ids::add));
        return ids;
    }
}
