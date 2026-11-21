package com.api.ero_api.filial.service;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.AcessoNegadoException;
import com.api.ero_api.compartilhado.exception.CampoInvalidoException;
import com.api.ero_api.compartilhado.exception.ConflitoCampoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.DocumentoValidator;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.compartilhado.util.RepetirSeCodigoRepetido;
import com.api.ero_api.compartilhado.util.RestricaoViolada;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.filial.dtos.FilialCreateDto;
import com.api.ero_api.filial.dtos.FilialResponseDto;
import com.api.ero_api.filial.dtos.FilialSelectDto;
import com.api.ero_api.filial.dtos.FilialUpdateDto;
import com.api.ero_api.filial.entity.Filial;
import com.api.ero_api.filial.enums.TipoFilial;
import com.api.ero_api.filial.mapper.FilialMapper;
import com.api.ero_api.filial.repository.FilialRepository;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.service.PessoaService;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
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
 * Matrizes e filiais do contratante. Segue a forma do {@code PessoaService}:
 * <ul>
 *   <li>todo método começa com {@code exigirTenantSelecionado()}, inclusive as leituras e o
 *       combo: na visão de plataforma (ROOT) o filtro de tenant não vale e o maior + 1
 *       pegaria o de todos;</li>
 *   <li>{@link #criar} não leva {@code @Transactional}: cada tentativa do código roda na
 *       própria transação ({@link RepetirSeCodigoRepetido});</li>
 *   <li>a regra "a matriz é do tipo MATRIZ e está ativa" envolve outra linha e não cabe em
 *       CHECK: criar uma filial em M, inativar M, reativar uma filial de M e transformar M em
 *       filial travam a linha de M antes de conferir, sempre em ordem de id (sem deadlock);</li>
 *   <li>escolher a pessoa da filial (no cadastro, ou trocar no PUT) exige {@code PESSOAS_LER}
 *       além de {@code FILIAIS_ESCREVER}, conferido antes de buscar a pessoa: sem isso a resposta
 *       revelaria nome e documento de quem o usuário não pode ler (e se o id existe). Na filial
 *       já gravada, com a mesma pessoa, cor e matriz mudam sem {@code PESSOAS_LER};</li>
 *   <li>a lista sai em ordem fixa (cada matriz seguida das suas filiais): {@code sort} é recusado;</li>
 *   <li>nada de dado pessoal em log; filial não gera evento de segurança.</li>
 * </ul>
 */
@Service
public class FilialService {

    /** Lista branca vazia: a ordem é a do JPQL (agrupada) e qualquer {@code sort} dá 422. */
    private static final Set<String> ORDENAVEIS = Set.of();
    /** Itens do combo de filiais: o usuário digita mais para achar a que não apareceu. */
    static final int LIMITE_SELECAO = 20;
    private static final String UK_CODIGO = "uk_filial_tenant_cod_filial";
    private static final String UK_PESSOA = "uk_filial_tenant_pessoa";
    private static final String MSG_NAO_ENCONTRADA = "Filial não encontrada.";
    private static final String MSG_VERSAO = "Esta filial foi alterada por outro usuário. Recarregue e tente de novo.";
    private static final String MSG_PESSOA_JA_FILIAL = "Esta pessoa já é uma filial.";
    private static final String MSG_SEM_PESSOAS = "Você não tem permissão para escolher a pessoa da filial. "
            + "Peça ao administrador o acesso a Pessoas.";
    /** Toda rota exige um contratante selecionado: a resposta nunca é da visão de plataforma. */
    private static final boolean PLATAFORMA = false;

    private final FilialRepository repository;
    private final PessoaService pessoaService;
    private final UsuarioService usuarioService;
    private final RepetirSeCodigoRepetido repetir;

    public FilialService(FilialRepository repository, PessoaService pessoaService, UsuarioService usuarioService,
                         RepetirSeCodigoRepetido repetir) {
        this.repository = repository;
        this.pessoaService = pessoaService;
        this.usuarioService = usuarioService;
        this.repetir = repetir;
    }

    // ---------------------------------------------------------------- leitura

    /** Lista com filtros, sem N+1: a página (pessoa e matriz por fetch), a contagem e os nomes da auditoria. */
    @Transactional(readOnly = true)
    public PaginaDto<FilialResponseDto> listar(Long codFilial, String busca, String documento, TipoFilial tipo,
                                               Boolean ativo, Pageable pageable) {
        SecurityUtils.exigirTenantSelecionado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, Sort.unsorted());
        String doc = DocumentoValidator.normalizar(documento);
        Page<Filial> filiais = repository.buscarComFiltros(codFilial, TextoBusca.normalizar(busca),
                doc == null || doc.isEmpty() ? null : doc, tipo, ativo, pagina);
        Map<UUID, String> autores = usuarioService.buscarNomes(idsDeAuditoria(filiais.getContent()));
        return PaginaDto.de(filiais, f -> FilialMapper.toResponseDto(f, autores, PLATAFORMA));
    }

    @Transactional(readOnly = true)
    public FilialResponseDto buscarPorId(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        return montarResposta(buscarEntidade(id));
    }

    /**
     * Combo: até {@value #LIMITE_SELECAO} filiais ativas, por nome. {@code tipo} restringe
     * (MATRIZ no combo de matriz); {@code ignorarId} tira a própria.
     */
    @Transactional(readOnly = true)
    public List<FilialSelectDto> listarParaSelecao(String busca, TipoFilial tipo, UUID ignorarId) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarParaSelecao(TextoBusca.normalizar(busca), tipo, ignorarId,
                        PageRequest.of(0, LIMITE_SELECAO))
                .stream().map(FilialMapper::toSelectDto).toList();
    }

    // ---------------------------------------------------------------- escrita

    /**
     * Sem {@code @Transactional}: o código pode repetir e cada tentativa precisa da própria
     * transação. A mesma pessoa em dois cadastros simultâneos (os dois passaram pela
     * consulta do {@link #exigirPessoaLivre}): o índice único segura, e o 409 sai com o
     * código de quem ficou com ela, lido depois que a transação que falhou já voltou.
     */
    public FilialResponseDto criar(FilialCreateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        exigirLerPessoas();
        try {
            return repetir.executar(UK_CODIGO, () -> gravarNova(dto));
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_PESSOA)) {
                throw repository.buscarCodigoPorPessoa(dto.pessoaId(), TenantContext.NENHUM)
                        .map(FilialService::pessoaJaFilial)
                        .orElseGet(() -> new ConflitoCampoException("pessoaId", MSG_PESSOA_JA_FILIAL));
            }
            throw e;
        }
    }

    /**
     * Ordem (o revisor confere): travar a filial e a matriz pedida, em ordem de id → ler com
     * a pessoa e a matriz → conferir a versão → regras → salvar.
     */
    @Transactional
    public FilialResponseDto atualizar(UUID id, FilialUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        Set<UUID> travar = new HashSet<>();
        travar.add(id);
        if (dto.tipo() == TipoFilial.FILIAL && dto.matrizId() != null) {
            travar.add(dto.matrizId());
        }
        if (!travar(travar).containsKey(id)) {
            throw new NaoEncontradoException(MSG_NAO_ENCONTRADA);
        }
        Filial f = buscarEntidade(id);
        if (!f.getVersion().equals(dto.version())) {
            throw new ConflitoException(MSG_VERSAO);
        }

        // A pessoa que não mudou não é reconferida (inativa continua, e PESSOAS_LER não é exigido).
        Pessoa pessoa = f.getPessoa();
        if (!pessoa.getId().equals(dto.pessoaId())) {
            exigirLerPessoas();
            pessoa = pessoaService.buscarEntidade(dto.pessoaId());
            exigirPessoaLivre(pessoa, id);
        }

        if (f.ehMatriz() && dto.tipo() == TipoFilial.FILIAL) {
            long filhas = repository.contarFilhas(id);
            if (filhas > 0) {
                throw new ConflitoCampoException("tipo", "Esta matriz tem " + filhas
                        + (filhas == 1 ? " filial" : " filiais")
                        + ". Mude a matriz delas antes de transformá-la em filial.");
            }
        }

        // A matriz que já estava não é reconferida (filial inativa de matriz inativa ainda troca a cor).
        Filial matrizAtual = f.getMatriz();
        Filial matriz = dto.tipo() == TipoFilial.FILIAL && matrizAtual != null
                && matrizAtual.getId().equals(dto.matrizId())
                ? matrizAtual
                : resolverMatriz(dto.tipo(), dto.matrizId(), id);

        FilialMapper.atualizarEntidade(f, dto, pessoa, matriz);
        salvar(f);
        return montarResposta(f);
    }

    /** Já inativa: 204 sem fazer nada. A matriz com filial ativa não inativa. */
    @Transactional
    public void inativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        Filial f = travar(Set.of(id)).get(id);
        if (f == null) {
            throw new NaoEncontradoException(MSG_NAO_ENCONTRADA);
        }
        if (!f.isAtivo()) {
            return;
        }
        if (f.ehMatriz()) {
            long ativas = repository.contarFilhasAtivas(id);
            if (ativas == 1) {
                throw new ConflitoException("Esta matriz tem 1 filial ativa. Inative-a antes.");
            }
            if (ativas > 1) {
                throw new ConflitoException("Esta matriz tem " + ativas + " filiais ativas. Inative-as antes.");
            }
        }
        f.setAtivo(false);
    }

    /**
     * Já ativa: 204 sem fazer nada. A filial só volta com a matriz ativa. Trava a filial e a
     * matriz juntas, em ordem de id: a matriz é lida antes só pelo id (sem carregar a filial,
     * que precisa vir já travada). Se a matriz mudou entre essa leitura e a trava (raro), é 409:
     * travar a nova depois da filial sairia da ordem de id e poderia dar deadlock.
     */
    @Transactional
    public void ativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        UUID matrizLida = repository.buscarMatrizId(id).orElse(null);
        Map<UUID, Filial> travadas = travar(Stream.of(id, matrizLida).filter(Objects::nonNull).toList());
        Filial f = travadas.get(id);
        if (f == null) {
            throw new NaoEncontradoException(MSG_NAO_ENCONTRADA);
        }
        if (f.isAtivo()) {
            return;
        }
        if (f.getMatriz() != null) {
            Filial matriz = travadas.get(f.getMatriz().getId());
            if (matriz == null) {
                throw new ConflitoException("A matriz desta filial acabou de ser alterada por outro usuário. "
                        + "Recarregue e tente de novo.");
            }
            if (!matriz.isAtivo()) {
                throw new ConflitoException("A matriz desta filial está inativa. Reative a matriz antes.");
            }
        }
        f.setAtivo(true);
    }

    // ---------------------------------------------------------------- regras

    /**
     * Uma tentativa do {@link #criar}, já dentro da transação dela: confere a pessoa, trava
     * e confere a matriz, pede o código imediatamente antes de gravar.
     */
    private FilialResponseDto gravarNova(FilialCreateDto dto) {
        Pessoa pessoa = pessoaService.buscarEntidade(dto.pessoaId());
        exigirPessoaLivre(pessoa, null);
        Filial matriz = resolverMatriz(dto.tipo(), dto.matrizId(), null);
        Filial f = FilialMapper.toEntity(dto, pessoa, matriz);
        f.setCodFilial(repository.buscarProximoCodigo());
        // Sem tradução aqui: o código repetido volta ao RepetirSeCodigoRepetido e a pessoa
        // repetida, ao criar (que diz o código de quem ficou com ela).
        repository.saveAndFlush(f);
        return montarResposta(f);
    }

    /**
     * Escolher a pessoa da filial mostra nome e documento dela: exige {@code PESSOAS_LER}
     * (ADMIN tem tudo). Vem antes de buscar a pessoa, para o 404/409 não revelar se o id existe.
     */
    private static void exigirLerPessoas() {
        if (!SecurityUtils.exigirUsuario().authorities().contains(GrupoLiberacao.PESSOAS.authorityLer())) {
            throw new AcessoNegadoException(MSG_SEM_PESSOAS);
        }
    }

    /** A pessoa nova da filial: ativa e sem outra filial. O 409 diz o código de quem já a usa. */
    private void exigirPessoaLivre(Pessoa p, UUID ignorarFilialId) {
        if (!p.isAtivo()) {
            throw new ConflitoCampoException("pessoaId", "Esta pessoa está inativa.");
        }
        repository.buscarCodigoPorPessoa(p.getId(), ignorarFilialId == null ? TenantContext.NENHUM : ignorarFilialId)
                .ifPresent(cod -> {
                    throw pessoaJaFilial(cod);
                });
    }

    /**
     * A matriz pedida para o tipo: nenhuma na MATRIZ; na FILIAL, uma matriz do contratante,
     * do tipo MATRIZ e ativa, conferida com a linha travada.
     *
     * @param propriaId a filial que está sendo alterada ({@code null} no cadastro)
     */
    private Filial resolverMatriz(TipoFilial tipo, UUID matrizId, UUID propriaId) {
        if (tipo == TipoFilial.MATRIZ) {
            if (matrizId != null) {
                throw new CampoInvalidoException("matrizId", "Matriz não responde a outra matriz. Deixe a matriz em branco.");
            }
            return null;
        }
        if (matrizId == null) {
            throw new CampoInvalidoException("matrizId", "Informe a matriz desta filial.");
        }
        if (matrizId.equals(propriaId)) {
            throw new CampoInvalidoException("matrizId", "A filial não pode ser a própria matriz.");
        }
        // No atualizar ela já veio travada: travar de novo na mesma transação não espera.
        Filial matriz = travar(Set.of(matrizId)).get(matrizId);
        if (matriz == null) {
            throw new NaoEncontradoException("Matriz não encontrada.");
        }
        if (!matriz.ehMatriz()) {
            throw new ConflitoCampoException("matrizId", "A matriz escolhida é uma filial. Escolha uma matriz.");
        }
        if (!matriz.isAtivo()) {
            throw new ConflitoCampoException("matrizId", "A matriz escolhida está inativa.");
        }
        return matriz;
    }

    /**
     * Salvar do {@link #atualizar}: {@code saveAndFlush} para a resposta já sair com a
     * {@code version} nova. A pessoa repetida numa corrida (as duas passaram pela consulta):
     * o índice único segura e vira o 409 com campo (a transação já abortou, então sem o
     * código). No cadastro a violação sobe como está, para o {@link #criar} tratar.
     */
    private void salvar(Filial f) {
        try {
            repository.saveAndFlush(f);
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_PESSOA)) {
                throw new ConflitoCampoException("pessoaId", MSG_PESSOA_JA_FILIAL);
            }
            throw e;
        }
    }

    /** Ficha: a filial já com pessoa, matriz e a pessoa da matriz, e os nomes da auditoria. */
    private FilialResponseDto montarResposta(Filial f) {
        return FilialMapper.toResponseDto(f, usuarioService.buscarNomes(idsDeAuditoria(List.of(f))), PLATAFORMA);
    }

    /** Respeita o tenant atual: filial de outro contratante dá 404. */
    private Filial buscarEntidade(UUID id) {
        return repository.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADA));
    }

    /** Trava em ordem de id (a consulta ordena). Devolve só as do contratante. */
    private Map<UUID, Filial> travar(Collection<UUID> ids) {
        Map<UUID, Filial> travadas = new LinkedHashMap<>();
        repository.travarPorIds(ids).forEach(f -> travadas.put(f.getId(), f));
        return travadas;
    }

    private static ConflitoCampoException pessoaJaFilial(Long codigo) {
        return new ConflitoCampoException("pessoaId", "Esta pessoa já é a filial código " + codigo + ".");
    }

    private static Set<UUID> idsDeAuditoria(Collection<Filial> filiais) {
        return filiais.stream()
                .flatMap(f -> Stream.of(f.getCreatedBy(), f.getUpdatedBy()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }
}
