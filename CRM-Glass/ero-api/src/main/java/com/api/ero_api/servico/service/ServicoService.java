package com.api.ero_api.servico.service;

import com.api.ero_api.auxiliar.entity.CategoriaServico;
import com.api.ero_api.auxiliar.service.CategoriaServicoService;
import com.api.ero_api.compartilhado.dtos.ErroCampoDto;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.CampoInvalidoException;
import com.api.ero_api.compartilhado.exception.ConflitoCampoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.compartilhado.util.RepetirSeCodigoRepetido;
import com.api.ero_api.compartilhado.util.RestricaoViolada;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.filial.entity.Filial;
import com.api.ero_api.filial.service.FilialService;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.servico.dtos.ServicoCreateDto;
import com.api.ero_api.servico.dtos.ServicoFilialItemDto;
import com.api.ero_api.servico.dtos.ServicoResponseDto;
import com.api.ero_api.servico.dtos.ServicoSelectDto;
import com.api.ero_api.servico.dtos.ServicoUpdateDto;
import com.api.ero_api.servico.entity.Servico;
import com.api.ero_api.servico.entity.ServicoFilial;
import com.api.ero_api.servico.mapper.ServicoMapper;
import com.api.ero_api.servico.repository.ServicoFilialRepository;
import com.api.ero_api.servico.repository.ServicoRepository;
import com.api.ero_api.usuario.service.UsuarioService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviços do contratante. Segue a forma do {@code FilialService} e do {@code PessoaService}:
 * <ul>
 *   <li>todo método começa com {@code exigirTenantSelecionado()}, inclusive as leituras e o
 *       combo: na visão de plataforma (ROOT) o filtro de tenant não vale e o maior + 1
 *       pegaria o de todos;</li>
 *   <li>{@link #criar} não leva {@code @Transactional}: cada tentativa do código roda na
 *       própria transação ({@link RepetirSeCodigoRepetido});</li>
 *   <li>o preço é só por filial e opcional (nulo = não informado; 0 = gratuito). A lista de
 *       filiais é onde o serviço é prestado, tem pelo menos uma (o DTO confere) e é o estado
 *       completo: substitui a anterior ({@code removerPorServico} + {@code saveAll});</li>
 *   <li>mudar só as filiais também sobe a {@code version} do serviço ({@code marcarAlteracao});</li>
 *   <li>categoria e filial inativas só passam se já estavam gravadas neste serviço; as
 *       recusas da categoria e das linhas saem todas num 400 só;</li>
 *   <li>a filial não depende do serviço: inativar a filial não olha os serviços;</li>
 *   <li>serviço não tem dado pessoal; nada de log de conteúdo, só id.</li>
 * </ul>
 */
@Service
public class ServicoService {

    private static final Set<String> ORDENAVEIS = Set.of("codServico", "nome");
    private static final Sort ORDEM_PADRAO = Sort.by("nome");
    /** Itens do combo de serviços: o usuário digita mais para achar o que não apareceu. */
    static final int LIMITE_SELECAO = 20;
    private static final String UK_CODIGO = "uk_servico_tenant_cod_servico";
    private static final String UK_NOME = "uk_servico_tenant_nome_busca";
    private static final String MSG_NAO_ENCONTRADO = "Serviço não encontrado.";
    private static final String MSG_VERSAO = "Este serviço foi alterado por outro usuário. Recarregue e tente de novo.";
    private static final String MSG_NOME_REPETIDO = "Já existe um serviço com este nome.";
    /** Toda rota exige um contratante selecionado: a resposta nunca é da visão de plataforma. */
    private static final boolean PLATAFORMA = false;

    private final ServicoRepository repository;
    private final ServicoFilialRepository filialRepository;
    private final CategoriaServicoService categoriaService;
    private final FilialService filialService;
    private final UsuarioService usuarioService;
    private final RepetirSeCodigoRepetido repetir;

    public ServicoService(ServicoRepository repository, ServicoFilialRepository filialRepository,
                          CategoriaServicoService categoriaService, FilialService filialService,
                          UsuarioService usuarioService, RepetirSeCodigoRepetido repetir) {
        this.repository = repository;
        this.filialRepository = filialRepository;
        this.categoriaService = categoriaService;
        this.filialService = filialService;
        this.usuarioService = usuarioService;
        this.repetir = repetir;
    }

    // ---------------------------------------------------------------- leitura

    /**
     * Lista com filtros, sem N+1: a página (categoria por fetch), a contagem, as filiais de
     * todos os serviços da página em lote e os nomes da auditoria = 4 consultas por página.
     */
    @Transactional(readOnly = true)
    public PaginaDto<ServicoResponseDto> listar(Long codServico, String busca, UUID categoriaId, UUID filialId,
                                                Boolean ativo, Pageable pageable) {
        SecurityUtils.exigirTenantSelecionado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, ORDEM_PADRAO);
        Page<Servico> servicos = repository.buscarComFiltros(codServico, TextoBusca.normalizar(busca), categoriaId,
                filialId, ativo, pagina);
        List<UUID> ids = servicos.getContent().stream().map(Servico::getId).toList();
        Map<UUID, List<ServicoFilial>> filiais = ids.isEmpty() ? Map.of()
                : filialRepository.buscarPorServicos(ids).stream()
                        .collect(Collectors.groupingBy(sf -> sf.getServico().getId()));
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(servicos.getContent()));
        return PaginaDto.de(servicos, s -> ServicoMapper.toResponseDto(s, filiais.getOrDefault(s.getId(), List.of()),
                autores, PLATAFORMA));
    }

    @Transactional(readOnly = true)
    public ServicoResponseDto buscarPorId(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        return montarResposta(buscarEntidade(id));
    }

    /** Combo: até {@value #LIMITE_SELECAO} serviços ativos, por nome. Sem preço. */
    @Transactional(readOnly = true)
    public List<ServicoSelectDto> listarParaSelecao(String busca) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarParaSelecao(TextoBusca.normalizar(busca), PageRequest.of(0, LIMITE_SELECAO))
                .stream().map(ServicoMapper::toSelectDto).toList();
    }

    // ---------------------------------------------------------------- escrita

    /**
     * Sem {@code @Transactional}: o código pode repetir e cada tentativa precisa da própria
     * transação. O mesmo nome em dois cadastros simultâneos (os dois passaram pelo
     * {@link #exigirNomeLivre}): o índice único segura, e o 409 sai com o código de quem
     * ficou com ele, lido depois que a transação que falhou já voltou.
     */
    public ServicoResponseDto criar(ServicoCreateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        try {
            return repetir.executar(UK_CODIGO, () -> gravarNovo(dto));
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_NOME)) {
                throw repository.buscarCodigoPorNome(TextoBusca.normalizar(dto.nome()), TenantContext.NENHUM)
                        .map(ServicoService::nomeRepetido)
                        .orElseGet(() -> new ConflitoCampoException("nome", MSG_NOME_REPETIDO));
            }
            throw e;
        }
    }

    /**
     * Ordem (o revisor confere): ler e conferir a versão → validar → nome livre →
     * {@code marcarAlteracao} (versão de novo, já com a linha travada: pega também quem salvou
     * só as filiais depois da leitura) → reler → salvar → substituir as filiais.
     */
    @Transactional
    public ServicoResponseDto atualizar(UUID id, ServicoUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        ServicoCreateDto dados = ServicoMapper.dados(dto);
        Servico s = buscarEntidade(id);
        if (!s.getVersion().equals(dto.version())) {
            throw new ConflitoException(MSG_VERSAO);
        }
        Referencias refs = validar(dados, s);
        exigirNomeLivre(TextoBusca.normalizar(dados.nome()), id);
        if (repository.marcarAlteracao(id, dto.version(), Instant.now(), SecurityUtils.getUsuarioIdLogado()) == 0) {
            throw new ConflitoException(MSG_VERSAO);
        }
        // O marcarAlteracao limpou a sessão: relê com a versão nova.
        s = buscarEntidade(id);
        ServicoMapper.atualizarEntidade(s, dto, refs.categoria());
        salvar(s);
        substituirFiliais(s, dados.valores(), refs.filiais());
        return montarResposta(s);
    }

    /** Já inativo: 204 sem fazer nada. O inativo some do combo e não entra em movimento novo. */
    @Transactional
    public void inativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        buscarEntidade(id).setAtivo(false);
    }

    /** Já ativo: 204 sem fazer nada. */
    @Transactional
    public void ativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        buscarEntidade(id).setAtivo(true);
    }

    // ---------------------------------------------------------------- regras

    /**
     * Uma tentativa do {@link #criar}, já dentro da transação dela: valida, pede o código
     * imediatamente antes de gravar e grava as filiais.
     */
    private ServicoResponseDto gravarNovo(ServicoCreateDto dto) {
        Referencias refs = validar(dto, null);
        exigirNomeLivre(TextoBusca.normalizar(dto.nome()), TenantContext.NENHUM);
        Servico s = ServicoMapper.toEntity(dto, refs.categoria());
        s.setCodServico(repository.buscarProximoCodigo());
        // Sem tradução do nome aqui: o código repetido volta ao RepetirSeCodigoRepetido e o
        // nome repetido, ao criar (que diz o código de quem ficou com ele).
        repository.saveAndFlush(s);
        gravarFiliais(s, dto.valores(), refs.filiais());
        return montarResposta(s);
    }

    /** A categoria e as filiais já conferidas pelo {@link #validar}; a categoria é nula quando não informada. */
    private record Referencias(CategoriaServico categoria, Map<UUID, Filial> filiais) {
    }

    /**
     * Regras que só o service vê: a categoria e cada linha das filiais (do contratante,
     * ativa ou já gravada neste serviço, sem repetir). Todas as recusas saem num 400 só,
     * com o caminho do campo ({@code categoriaId}, {@code valores[1].filialId}), no formato
     * do Bean Validation. Filial ou categoria de outro contratante dá o mesmo "não encontrada".
     *
     * @param atual o serviço gravado ou {@code null} no cadastro
     */
    private Referencias validar(ServicoCreateDto dados, Servico atual) {
        List<ErroCampoDto> erros = new ArrayList<>();

        CategoriaServico categoria = null;
        if (dados.categoriaId() != null) {
            categoria = categoriaService.buscarPorIds(Set.of(dados.categoriaId())).get(dados.categoriaId());
            boolean jaEra = atual != null && atual.getCategoria() != null
                    && dados.categoriaId().equals(atual.getCategoria().getId());
            if (categoria == null) {
                erros.add(new ErroCampoDto("categoriaId", "Categoria de serviço não encontrada."));
            } else if (!categoria.isAtivo() && !jaEra) {
                erros.add(new ErroCampoDto("categoriaId", "Categoria de serviço inativa."));
            }
        }

        List<ServicoFilialItemDto> valores = dados.valores();
        Set<UUID> jaGravadas = atual == null ? Set.of() : filialRepository.buscarPorServico(atual.getId()).stream()
                .map(sf -> sf.getFilial().getId()).collect(Collectors.toSet());
        Map<UUID, Filial> filiais = filialService.buscarPorIds(
                valores.stream().map(ServicoFilialItemDto::filialId).collect(Collectors.toSet()));
        Set<UUID> vistas = new HashSet<>();
        for (int i = 0; i < valores.size(); i++) {
            UUID filialId = valores.get(i).filialId();
            String campo = "valores[" + i + "].filialId";
            Filial f = filiais.get(filialId);
            if (!vistas.add(filialId)) {
                erros.add(new ErroCampoDto(campo, "Esta filial já está na lista."));
            } else if (f == null) {
                erros.add(new ErroCampoDto(campo, "Filial não encontrada."));
            } else if (!f.isAtivo() && !jaGravadas.contains(filialId)) {
                erros.add(new ErroCampoDto(campo, "Esta filial está inativa."));
            }
        }

        if (!erros.isEmpty()) {
            throw new CampoInvalidoException(erros);
        }
        return new Referencias(categoria, filiais);
    }

    /** Nome único no contratante sem caixa nem acento. O 409 diz o código de quem já o usa. */
    private void exigirNomeLivre(String nomeBusca, UUID ignorarId) {
        repository.buscarCodigoPorNome(nomeBusca, ignorarId).ifPresent(cod -> {
            throw nomeRepetido(cod);
        });
    }

    /**
     * Salvar do {@link #atualizar}: {@code saveAndFlush} para a resposta já sair com a
     * {@code version} nova. O nome repetido numa corrida (os dois passaram pela consulta): o
     * índice único segura e vira o 409 com campo (a transação já abortou, então sem o código).
     */
    private void salvar(Servico s) {
        try {
            repository.saveAndFlush(s);
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_NOME)) {
                throw new ConflitoCampoException("nome", MSG_NOME_REPETIDO);
            }
            throw e;
        }
    }

    /** A lista substitui a anterior: apaga as filiais do serviço e grava as que chegaram. */
    private void substituirFiliais(Servico s, List<ServicoFilialItemDto> valores, Map<UUID, Filial> filiais) {
        filialRepository.removerPorServico(s.getId());
        gravarFiliais(s, valores, filiais);
    }

    private void gravarFiliais(Servico s, List<ServicoFilialItemDto> valores, Map<UUID, Filial> filiais) {
        filialRepository.saveAll(valores.stream()
                .map(item -> ServicoMapper.toFilial(item, s, filiais.get(item.filialId())))
                .toList());
    }

    /** Resposta de um serviço só (ficha, criar, alterar): as filiais e os nomes da auditoria. */
    private ServicoResponseDto montarResposta(Servico s) {
        return ServicoMapper.toResponseDto(s, filialRepository.buscarPorServico(s.getId()),
                usuarioService.buscarNomes(idsDeAuditoria(List.of(s))), PLATAFORMA);
    }

    /** Respeita o tenant atual: serviço de outro contratante dá 404. */
    private Servico buscarEntidade(UUID id) {
        return repository.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADO));
    }

    private static ConflitoCampoException nomeRepetido(Long codigo) {
        return new ConflitoCampoException("nome", "Já existe o serviço código " + codigo + " com este nome.");
    }

    private static Set<UUID> idsDeAuditoria(Collection<Servico> servicos) {
        return servicos.stream()
                .flatMap(s -> Stream.of(s.getCreatedBy(), s.getUpdatedBy()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }
}
