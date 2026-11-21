package com.api.ero_api.pessoa.service;

import com.api.ero_api.auxiliar.entity.EstadoCivil;
import com.api.ero_api.auxiliar.entity.Profissao;
import com.api.ero_api.auxiliar.entity.TipoCadastro;
import com.api.ero_api.auxiliar.entity.TipoEmail;
import com.api.ero_api.auxiliar.entity.TipoEndereco;
import com.api.ero_api.auxiliar.entity.TipoRedeSocial;
import com.api.ero_api.auxiliar.entity.TipoTelefone;
import com.api.ero_api.auxiliar.service.EstadoCivilService;
import com.api.ero_api.auxiliar.service.ProfissaoService;
import com.api.ero_api.auxiliar.service.TipoCadastroService;
import com.api.ero_api.auxiliar.service.TipoEmailService;
import com.api.ero_api.auxiliar.service.TipoEnderecoService;
import com.api.ero_api.auxiliar.service.TipoRedeSocialService;
import com.api.ero_api.auxiliar.service.TipoTelefoneService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.CampoInvalidoException;
import com.api.ero_api.compartilhado.exception.ConflitoCampoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.util.DocumentoValidator;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.compartilhado.util.RepetirSeCodigoRepetido;
import com.api.ero_api.compartilhado.util.RestricaoViolada;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.localidade.entity.Cidade;
import com.api.ero_api.localidade.entity.Estado;
import com.api.ero_api.localidade.service.LocalidadeService;
import com.api.ero_api.pessoa.dtos.PessoaCreateDto;
import com.api.ero_api.pessoa.dtos.PessoaEmailItemDto;
import com.api.ero_api.pessoa.dtos.PessoaEnderecoItemDto;
import com.api.ero_api.pessoa.dtos.PessoaListaDto;
import com.api.ero_api.pessoa.dtos.PessoaRedeSocialItemDto;
import com.api.ero_api.pessoa.dtos.PessoaResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaSelectDto;
import com.api.ero_api.pessoa.dtos.PessoaTelefoneItemDto;
import com.api.ero_api.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_api.pessoa.dtos.PessoaVinculoItemDto;
import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.entity.PessoaEmail;
import com.api.ero_api.pessoa.entity.PessoaEndereco;
import com.api.ero_api.pessoa.entity.PessoaRedeSocial;
import com.api.ero_api.pessoa.entity.PessoaTelefone;
import com.api.ero_api.pessoa.entity.PessoaTipoCadastro;
import com.api.ero_api.pessoa.entity.PessoaVinculo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import com.api.ero_api.pessoa.enums.TipoVinculo;
import com.api.ero_api.pessoa.mapper.PessoaMapper;
import com.api.ero_api.pessoa.repository.PessoaEmailRepository;
import com.api.ero_api.pessoa.repository.PessoaEnderecoRepository;
import com.api.ero_api.pessoa.repository.PessoaRedeSocialRepository;
import com.api.ero_api.pessoa.repository.PessoaRepository;
import com.api.ero_api.pessoa.repository.PessoaTelefoneRepository;
import com.api.ero_api.pessoa.repository.PessoaTipoCadastroRepository;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.usuario.service.UsuarioService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pessoas do contratante (física e jurídica), com tipos de cadastro, telefones, e-mails,
 * redes sociais, endereços e vínculos. Segue a forma do {@code UsuarioService}, mais:
 * <ul>
 *   <li>todo método começa com {@code exigirTenantSelecionado()}, inclusive as leituras: na
 *       visão de plataforma (ROOT) o filtro de tenant não vale e o maior + 1 pegaria o de todos;</li>
 *   <li>{@link #criar} não leva {@code @Transactional}: cada tentativa do código roda na
 *       própria transação ({@link RepetirSeCodigoRepetido});</li>
 *   <li>as filhas chegam sem {@code id}: cada lista é o estado completo e substitui a anterior;</li>
 *   <li>vínculo: salvar trava as duas pessoas em ordem de id (sem deadlock) e sobe a versão
 *       da outra quando o vínculo dela mudou (a ficha aberta do outro lado recebe 409);</li>
 *   <li>nada de dado pessoal em log; pessoa não gera evento de segurança.</li>
 * </ul>
 */
@Service
public class PessoaService {

    private static final Set<String> ORDENAVEIS = Set.of("codPessoa", "nome", "createdAt");
    private static final Sort ORDEM_PADRAO = Sort.by("nome");
    /** Itens do combo de pessoas: o usuário digita mais para achar a que não apareceu. */
    static final int LIMITE_SELECAO = 20;
    /** Piso da data de nascimento, da emissão do RG e da validade da CNH (o teto das duas primeiras é hoje, no DTO). */
    private static final LocalDate NASCIMENTO_MINIMO = LocalDate.of(1900, 1, 1);
    /** Piso da data de abertura da jurídica (o teto é hoje, no DTO). */
    private static final LocalDate ABERTURA_MINIMA = LocalDate.of(1800, 1, 1);
    /** Teto da validade da CNH: hoje + 15 anos (contra erro de digitação; vencida é aceita). */
    private static final int VALIDADE_CNH_ANOS = 15;
    /** Sigla do órgão emissor do RG, já em maiúsculas: "SSP", "DETRAN", "SSP/SP", "PC-RS". */
    private static final Pattern ORGAO_EMISSOR = Pattern.compile("^[A-Z][A-Z /-]{1,14}$");
    private static final String UK_CODIGO = "uk_pessoa_tenant_cod_pessoa";
    private static final String UK_CPF = "uk_pessoa_tenant_cpf";
    private static final String UK_CNPJ = "uk_pessoa_tenant_cnpj";
    private static final String MSG_NAO_ENCONTRADA = "Pessoa não encontrada.";
    private static final String MSG_REPRESENTANTE_PF = "O representante legal precisa ser pessoa física.";
    private static final String MSG_VERSAO = "Esta pessoa foi alterada por outro usuário. Recarregue e tente de novo.";
    /** Toda rota exige um contratante selecionado: a resposta nunca é da visão de plataforma. */
    private static final boolean PLATAFORMA = false;

    private final PessoaRepository repository;
    private final PessoaTipoCadastroRepository tipoCadastroRepository;
    private final PessoaTelefoneRepository telefoneRepository;
    private final PessoaEmailRepository emailRepository;
    private final PessoaRedeSocialRepository redeSocialRepository;
    private final PessoaEnderecoRepository enderecoRepository;
    private final PessoaVinculoService vinculoService;
    private final TipoCadastroService tipoCadastroService;
    private final TipoTelefoneService tipoTelefoneService;
    private final TipoEmailService tipoEmailService;
    private final TipoRedeSocialService tipoRedeSocialService;
    private final TipoEnderecoService tipoEnderecoService;
    private final EstadoCivilService estadoCivilService;
    private final ProfissaoService profissaoService;
    private final LocalidadeService localidadeService;
    private final UsuarioService usuarioService;
    private final RepetirSeCodigoRepetido repetir;

    public PessoaService(PessoaRepository repository, PessoaTipoCadastroRepository tipoCadastroRepository,
                         PessoaTelefoneRepository telefoneRepository, PessoaEmailRepository emailRepository,
                         PessoaRedeSocialRepository redeSocialRepository, PessoaEnderecoRepository enderecoRepository,
                         PessoaVinculoService vinculoService, TipoCadastroService tipoCadastroService,
                         TipoTelefoneService tipoTelefoneService, TipoEmailService tipoEmailService,
                         TipoRedeSocialService tipoRedeSocialService, TipoEnderecoService tipoEnderecoService,
                         EstadoCivilService estadoCivilService, ProfissaoService profissaoService,
                         LocalidadeService localidadeService,
                         UsuarioService usuarioService,
                         RepetirSeCodigoRepetido repetir) {
        this.repository = repository;
        this.tipoCadastroRepository = tipoCadastroRepository;
        this.telefoneRepository = telefoneRepository;
        this.emailRepository = emailRepository;
        this.redeSocialRepository = redeSocialRepository;
        this.enderecoRepository = enderecoRepository;
        this.vinculoService = vinculoService;
        this.tipoCadastroService = tipoCadastroService;
        this.tipoTelefoneService = tipoTelefoneService;
        this.tipoEmailService = tipoEmailService;
        this.tipoRedeSocialService = tipoRedeSocialService;
        this.tipoEnderecoService = tipoEnderecoService;
        this.estadoCivilService = estadoCivilService;
        this.profissaoService = profissaoService;
        this.localidadeService = localidadeService;
        this.usuarioService = usuarioService;
        this.repetir = repetir;
    }

    // ---------------------------------------------------------------- leitura

    /**
     * Lista com filtros, sem N+1: a página, a contagem, os tipos de cadastro e os três
     * principais (telefone, e-mail, endereço) em lote = 6 consultas por página.
     */
    @Transactional(readOnly = true)
    public PaginaDto<PessoaListaDto> listar(Long codPessoa, String busca, String documento, TipoPessoa tipoPessoa,
                                            UUID tipoCadastroId, Boolean ativo, Pageable pageable) {
        SecurityUtils.exigirTenantSelecionado();
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, ORDEM_PADRAO);
        String doc = DocumentoValidator.normalizar(documento);
        Page<Pessoa> pessoas = repository.buscarComFiltros(codPessoa, TextoBusca.normalizar(busca),
                doc == null || doc.isEmpty() ? null : doc, tipoPessoa, tipoCadastroId, ativo, pagina);
        List<UUID> ids = pessoas.getContent().stream().map(Pessoa::getId).toList();
        if (ids.isEmpty()) {
            return PaginaDto.de(pessoas, p -> PessoaMapper.toListaDto(p, List.of(), null, null, null));
        }
        Map<UUID, List<PessoaTipoCadastro>> tipos = tipoCadastroRepository.buscarPorPessoas(ids).stream()
                .collect(Collectors.groupingBy(x -> x.getPessoa().getId()));
        Map<UUID, PessoaTelefone> telefones = porPessoa(telefoneRepository.buscarPrincipaisPorPessoas(ids),
                PessoaTelefone::getPessoa);
        Map<UUID, PessoaEmail> emails = porPessoa(emailRepository.buscarPrincipaisPorPessoas(ids), PessoaEmail::getPessoa);
        Map<UUID, PessoaEndereco> enderecos = porPessoa(enderecoRepository.buscarPrincipaisPorPessoas(ids),
                PessoaEndereco::getPessoa);
        return PaginaDto.de(pessoas, p -> PessoaMapper.toListaDto(p, tipos.getOrDefault(p.getId(), List.of()),
                telefones.get(p.getId()), emails.get(p.getId()), enderecos.get(p.getId())));
    }

    @Transactional(readOnly = true)
    public PessoaResponseDto buscarPorId(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        return montarResposta(buscarEntidade(id));
    }

    /** Combo: até {@value #LIMITE_SELECAO} pessoas ativas, por nome. {@code ignorarId} tira a própria pessoa. */
    @Transactional(readOnly = true)
    public List<PessoaSelectDto> listarParaSelecao(String busca, UUID ignorarId) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarParaSelecao(TextoBusca.normalizar(busca), ignorarId, PageRequest.of(0, LIMITE_SELECAO))
                .stream().map(PessoaMapper::toSelectDto).toList();
    }

    /** Para outros services. Respeita o tenant atual: pessoa de outro contratante dá 404. */
    @Transactional(readOnly = true)
    public Pessoa buscarEntidade(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        return repository.buscarPorId(id).orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADA));
    }

    // ---------------------------------------------------------------- escrita

    /** Sem {@code @Transactional}: o código pode repetir e cada tentativa precisa da própria transação. */
    public PessoaResponseDto criar(PessoaCreateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        return repetir.executar(UK_CODIGO, () -> gravarNova(dto));
    }

    /**
     * Ordem (o revisor confere): ler e conferir a versão → travar a pessoa e as outras do
     * vínculo, antigas e novas, em ordem de id → {@code marcarAlteracao} (versão de novo, já
     * com a trava: pega também o vínculo salvo pelo outro lado depois da leitura) → reler →
     * validar → salvar → filhas → vínculos.
     */
    @Transactional
    public PessoaResponseDto atualizar(UUID id, PessoaUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        PessoaCreateDto dados = PessoaMapper.dados(dto);
        Pessoa p = buscarEntidade(id);
        if (!p.getVersion().equals(dto.version())) {
            throw new ConflitoException(MSG_VERSAO);
        }
        Set<UUID> envolvidas = new HashSet<>();
        envolvidas.add(id);
        envolvidas.addAll(outrasPessoas(vinculoService.buscarDaPessoa(id), id));
        envolvidas.addAll(idsDosVinculos(dados.vinculos()));
        travar(envolvidas);
        if (repository.marcarAlteracao(id, dto.version(), Instant.now(), SecurityUtils.getUsuarioIdLogado()) == 0) {
            throw new ConflitoException(MSG_VERSAO);
        }
        // O marcarAlteracao limpou a sessão: relê tudo já travado, com a versão nova.
        Map<UUID, Pessoa> travadas = travar(envolvidas);
        p = travadas.get(id);
        List<PessoaVinculo> antes = vinculoService.buscarDaPessoa(id);
        Referencias refs = validar(dados, p, travadas, outrasPessoas(antes, id));
        PessoaMapper.atualizarEntidade(p, dto, refs.rgEstado(), refs.estadoCivil(), refs.profissao(),
                refs.naturalidade());
        PessoaMapper.nomeBusca(p);
        salvar(p);
        substituirFilhas(p, dados, refs);
        marcarAlteradasPorVinculo(vinculoService.sincronizar(p, lista(dados.vinculos()), antes, travadas));
        return montarResposta(p);
    }

    /** Já inativa: 204 sem fazer nada. Os vínculos com ela continuam; ela só não entra em vínculo novo. */
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
     * Uma tentativa do {@link #criar}, já dentro da transação dela: trava as pessoas dos
     * vínculos, valida, pede o código imediatamente antes de gravar e grava as filhas.
     */
    private PessoaResponseDto gravarNova(PessoaCreateDto dto) {
        Map<UUID, Pessoa> travadas = travar(idsDosVinculos(dto.vinculos()));
        Referencias refs = validar(dto, null, travadas, Set.of());
        Pessoa p = PessoaMapper.toEntity(dto, refs.rgEstado(), refs.estadoCivil(), refs.profissao(), refs.naturalidade());
        PessoaMapper.nomeBusca(p);
        p.setCodPessoa(repository.buscarProximoCodigo());
        salvar(p);
        gravarFilhas(p, dto, refs);
        marcarAlteradasPorVinculo(vinculoService.sincronizar(p, lista(dto.vinculos()), List.of(), travadas));
        return montarResposta(p);
    }

    /**
     * {@code saveAndFlush} para a resposta já sair com a {@code version} nova. CPF ou CNPJ
     * repetido numa corrida (os dois passaram pela consulta do {@link #validar}): o índice
     * único segura e vira o 409 com campo. O índice do código sobe como está, para o
     * {@link RepetirSeCodigoRepetido} tentar de novo.
     */
    private void salvar(Pessoa p) {
        try {
            repository.saveAndFlush(p);
        } catch (DataIntegrityViolationException e) {
            if (RestricaoViolada.violou(e, UK_CPF)) {
                throw new ConflitoCampoException("cpf", "CPF já cadastrado.");
            }
            if (RestricaoViolada.violou(e, UK_CNPJ)) {
                throw new ConflitoCampoException("cnpj", "CNPJ já cadastrado.");
            }
            throw e;
        }
    }

    /** As 5 listas substituem as anteriores: apaga tudo da pessoa e grava o que chegou. */
    private void substituirFilhas(Pessoa p, PessoaCreateDto dados, Referencias refs) {
        UUID id = p.getId();
        tipoCadastroRepository.removerPorPessoa(id);
        telefoneRepository.removerPorPessoa(id);
        emailRepository.removerPorPessoa(id);
        redeSocialRepository.removerPorPessoa(id);
        enderecoRepository.removerPorPessoa(id);
        gravarFilhas(p, dados, refs);
    }

    /** Ordem = posição na lista. Nenhum principal marcado: o primeiro vira o principal. */
    private void gravarFilhas(Pessoa p, PessoaCreateDto dados, Referencias refs) {
        tipoCadastroRepository.saveAll(dados.tiposCadastroIds().stream()
                .map(tipoId -> PessoaMapper.tipoCadastro(p, refs.tiposCadastro().get(tipoId)))
                .toList());

        List<PessoaTelefoneItemDto> telefones = lista(dados.telefones());
        int telefonePrincipal = indicePrincipal(telefones.stream().map(PessoaTelefoneItemDto::principal).toList());
        telefoneRepository.saveAll(IntStream.range(0, telefones.size())
                .mapToObj(i -> PessoaMapper.telefone(telefones.get(i), p, refs.telefones().get(telefones.get(i).tipoId()),
                        i, i == telefonePrincipal))
                .toList());

        List<PessoaEmailItemDto> emails = lista(dados.emails());
        int emailPrincipal = indicePrincipal(emails.stream().map(PessoaEmailItemDto::principal).toList());
        emailRepository.saveAll(IntStream.range(0, emails.size())
                .mapToObj(i -> PessoaMapper.email(emails.get(i), p, refs.emails().get(emails.get(i).tipoId()),
                        i, i == emailPrincipal))
                .toList());

        List<PessoaRedeSocialItemDto> redes = lista(dados.redesSociais());
        redeSocialRepository.saveAll(IntStream.range(0, redes.size())
                .mapToObj(i -> PessoaMapper.redeSocial(redes.get(i), p, refs.redesSociais().get(redes.get(i).tipoId()), i))
                .toList());

        List<PessoaEnderecoItemDto> enderecos = lista(dados.enderecos());
        int enderecoPrincipal = indicePrincipal(enderecos.stream().map(PessoaEnderecoItemDto::principal).toList());
        enderecoRepository.saveAll(IntStream.range(0, enderecos.size())
                .mapToObj(i -> PessoaMapper.endereco(enderecos.get(i), p, refs.enderecos().get(enderecos.get(i).tipoId()),
                        refs.cidades().get(enderecos.get(i).cidadeId()), i, i == enderecoPrincipal))
                .toList());
    }

    /**
     * Tipos e cidades já conferidos pelo {@link #validar}, por id, para montar as filhas; e as
     * referências da própria pessoa (UF do RG, estado civil, profissão, naturalidade), nulas
     * quando não informadas.
     */
    private record Referencias(Map<UUID, TipoCadastro> tiposCadastro, Map<UUID, TipoTelefone> telefones,
                               Map<UUID, TipoEmail> emails, Map<UUID, TipoRedeSocial> redesSociais,
                               Map<UUID, TipoEndereco> enderecos, Map<UUID, Cidade> cidades,
                               Estado rgEstado, EstadoCivil estadoCivil, Profissao profissao, Cidade naturalidade) {
    }

    /**
     * Regras que só o service vê. Cada recusa marca o campo ({@code telefones[1].tipoId},
     * {@code vinculos[0].pessoaId}...) no mesmo formato do Bean Validation.
     *
     * @param atual         a pessoa gravada (já travada e relida) ou {@code null} no cadastro
     * @param travadas      as pessoas dos vínculos (e a própria), travadas; quem não está aqui
     *                      não existe ou é de outro contratante
     * @param jaVinculadas  as outras pessoas que já tinham vínculo com esta (inativa só passa se já estava)
     */
    private Referencias validar(PessoaCreateDto dados, Pessoa atual, Map<UUID, Pessoa> travadas,
                                Set<UUID> jaVinculadas) {
        boolean fisica = dados.tipoPessoa() == TipoPessoa.FISICA;
        UUID ignorarId = atual == null ? TenantContext.NENHUM : atual.getId();
        validarCamposDoTipo(dados, fisica);
        validarDocumentos(dados, fisica, ignorarId);
        validarTamanhos(dados, fisica);
        validarComplementos(dados, fisica);

        Anteriores antes = atual == null ? Anteriores.NENHUM : anteriores(atual.getId());
        Map<UUID, TipoCadastro> tiposCadastro = tipoCadastroService.buscarPorIds(dados.tiposCadastroIds());
        for (UUID tipoId : dados.tiposCadastroIds()) {
            exigirTipo(tiposCadastro, tipoId, antes.tiposCadastro(), TipoCadastro::isAtivo, "tiposCadastroIds",
                    "Tipo de cadastro");
        }

        List<PessoaTelefoneItemDto> telefones = lista(dados.telefones());
        Map<UUID, TipoTelefone> tiposTelefone = tipoTelefoneService.buscarPorIds(
                telefones.stream().map(PessoaTelefoneItemDto::tipoId).collect(Collectors.toSet()));
        for (int i = 0; i < telefones.size(); i++) {
            exigirTipo(tiposTelefone, telefones.get(i).tipoId(), antes.telefones(), TipoTelefone::isAtivo,
                    "telefones[" + i + "].tipoId", "Tipo de telefone");
        }
        exigirNoMaximoUmPrincipal(telefones.stream().map(PessoaTelefoneItemDto::principal),
                "telefones", "Marque só um telefone principal.");

        List<PessoaEmailItemDto> emails = lista(dados.emails());
        Map<UUID, TipoEmail> tiposEmail = tipoEmailService.buscarPorIds(
                emails.stream().map(PessoaEmailItemDto::tipoId).collect(Collectors.toSet()));
        for (int i = 0; i < emails.size(); i++) {
            exigirTipo(tiposEmail, emails.get(i).tipoId(), antes.emails(), TipoEmail::isAtivo,
                    "emails[" + i + "].tipoId", "Tipo de e-mail");
        }
        exigirNoMaximoUmPrincipal(emails.stream().map(PessoaEmailItemDto::principal),
                "emails", "Marque só um e-mail principal.");

        List<PessoaRedeSocialItemDto> redes = lista(dados.redesSociais());
        Map<UUID, TipoRedeSocial> tiposRede = tipoRedeSocialService.buscarPorIds(
                redes.stream().map(PessoaRedeSocialItemDto::tipoId).collect(Collectors.toSet()));
        for (int i = 0; i < redes.size(); i++) {
            exigirTipo(tiposRede, redes.get(i).tipoId(), antes.redesSociais(), TipoRedeSocial::isAtivo,
                    "redesSociais[" + i + "].tipoId", "Tipo de rede social");
            if (PessoaMapper.textoOuNulo(redes.get(i).usuario()) == null
                    && PessoaMapper.textoOuNulo(redes.get(i).url()) == null) {
                throw new CampoInvalidoException("redesSociais[" + i + "].usuario", "Informe o usuário ou o link.");
            }
        }

        List<PessoaEnderecoItemDto> enderecos = lista(dados.enderecos());
        Map<UUID, TipoEndereco> tiposEndereco = tipoEnderecoService.buscarPorIds(
                enderecos.stream().map(PessoaEnderecoItemDto::tipoId).collect(Collectors.toSet()));
        // As cidades dos endereços e a naturalidade numa consulta só.
        Set<UUID> idsCidades = enderecos.stream().map(PessoaEnderecoItemDto::cidadeId)
                .collect(Collectors.toCollection(HashSet::new));
        if (dados.naturalidadeId() != null) {
            idsCidades.add(dados.naturalidadeId());
        }
        Map<UUID, Cidade> cidades = localidadeService.buscarCidades(idsCidades);
        for (int i = 0; i < enderecos.size(); i++) {
            exigirTipo(tiposEndereco, enderecos.get(i).tipoId(), antes.enderecos(), TipoEndereco::isAtivo,
                    "enderecos[" + i + "].tipoId", "Tipo de endereço");
            if (!cidades.containsKey(enderecos.get(i).cidadeId())) {
                throw new CampoInvalidoException("enderecos[" + i + "].cidadeId", "Cidade não encontrada.");
            }
        }
        exigirNoMaximoUmPrincipal(enderecos.stream().map(PessoaEnderecoItemDto::principal),
                "enderecos", "Marque só um endereço principal.");

        Estado rgEstado = dados.rgEstadoId() == null ? null : localidadeService.buscarEstado(dados.rgEstadoId())
                .orElseThrow(() -> new CampoInvalidoException("rgEstadoId", "UF não encontrada."));
        Cidade naturalidade = null;
        if (dados.naturalidadeId() != null) {
            naturalidade = cidades.get(dados.naturalidadeId());
            if (naturalidade == null) {
                throw new CampoInvalidoException("naturalidadeId", "Cidade não encontrada.");
            }
        }
        EstadoCivil estadoCivil = estadoCivil(dados.estadoCivilId(), atual);
        Profissao profissao = profissao(dados.profissaoId(), atual);

        validarVinculos(lista(dados.vinculos()), atual, fisica, travadas, jaVinculadas);
        return new Referencias(tiposCadastro, tiposTelefone, tiposEmail, tiposRede, tiposEndereco, cidades,
                rgEstado, estadoCivil, profissao, naturalidade);
    }

    /**
     * Estado civil do contratante (o tenant filtra a busca): de outro contratante ou
     * inexistente dá "não encontrado"; inativo só passa se já era o desta pessoa.
     */
    private EstadoCivil estadoCivil(UUID id, Pessoa atual) {
        if (id == null) {
            return null;
        }
        EstadoCivil e = estadoCivilService.buscarPorIds(Set.of(id)).get(id);
        if (e == null) {
            throw new CampoInvalidoException("estadoCivilId", "Estado civil não encontrado.");
        }
        boolean jaEra = atual != null && atual.getEstadoCivil() != null && id.equals(atual.getEstadoCivil().getId());
        if (!e.isAtivo() && !jaEra) {
            throw new CampoInvalidoException("estadoCivilId", "Estado civil inativo.");
        }
        return e;
    }

    /** Profissão do contratante, com a mesma regra do {@link #estadoCivil}. */
    private Profissao profissao(UUID id, Pessoa atual) {
        if (id == null) {
            return null;
        }
        Profissao e = profissaoService.buscarPorIds(Set.of(id)).get(id);
        if (e == null) {
            throw new CampoInvalidoException("profissaoId", "Profissão não encontrada.");
        }
        boolean jaEra = atual != null && atual.getProfissao() != null && id.equals(atual.getProfissao().getId());
        if (!e.isAtivo() && !jaEra) {
            throw new CampoInvalidoException("profissaoId", "Profissão inativa.");
        }
        return e;
    }

    /** O campo do outro tipo vem nulo ou vazio; preenchido = 400 no campo (o front limpa ao trocar o tipo). */
    private static void validarCamposDoTipo(PessoaCreateDto d, boolean fisica) {
        if (fisica) {
            recusarPreenchido(d.cnpj(), "cnpj", "Pessoa física não tem CNPJ.");
            recusarPreenchido(d.nomeFantasia(), "nomeFantasia", "Pessoa física não tem nome fantasia.");
            recusarPreenchido(d.inscricaoEstadual(), "inscricaoEstadual", "Pessoa física não tem inscrição estadual.");
            recusarPreenchido(d.inscricaoMunicipal(), "inscricaoMunicipal", "Pessoa física não tem inscrição municipal.");
            recusarInformado(d.dataAbertura(), "dataAbertura", "Pessoa física não tem data de abertura.");
        } else {
            recusarPreenchido(d.cpf(), "cpf", "Pessoa jurídica não tem CPF.");
            recusarPreenchido(d.rg(), "rg", "Pessoa jurídica não tem RG.");
            recusarInformado(d.dataNascimento(), "dataNascimento", "Pessoa jurídica não tem data de nascimento.");
            recusarInformado(d.sexo(), "sexo", "Pessoa jurídica não tem sexo.");
            recusarPreenchido(d.rgOrgaoEmissor(), "rgOrgaoEmissor", "Pessoa jurídica não tem RG.");
            recusarInformado(d.rgEstadoId(), "rgEstadoId", "Pessoa jurídica não tem RG.");
            recusarInformado(d.rgDataEmissao(), "rgDataEmissao", "Pessoa jurídica não tem RG.");
            recusarPreenchido(d.cnh(), "cnh", "Pessoa jurídica não tem CNH.");
            recusarInformado(d.cnhCategoria(), "cnhCategoria", "Pessoa jurídica não tem CNH.");
            recusarInformado(d.cnhValidade(), "cnhValidade", "Pessoa jurídica não tem CNH.");
            recusarInformado(d.estadoCivilId(), "estadoCivilId", "Pessoa jurídica não tem estado civil.");
            recusarInformado(d.profissaoId(), "profissaoId", "Pessoa jurídica não tem profissão.");
            recusarPreenchido(d.nacionalidade(), "nacionalidade", "Pessoa jurídica não tem nacionalidade.");
            recusarInformado(d.naturalidadeId(), "naturalidadeId", "Pessoa jurídica não tem naturalidade.");
            recusarPreenchido(d.nomeMae(), "nomeMae", "Pessoa jurídica não tem filiação.");
            recusarPreenchido(d.nomePai(), "nomePai", "Pessoa jurídica não tem filiação.");
        }
    }

    /**
     * Os documentos e os dados civis da física e a abertura da jurídica (o campo do outro
     * tipo já foi recusado): RG e CNH como grupos (o complemento só existe com o número),
     * DV da CNH, datas com piso e teto, nacionalidade com piso.
     */
    private static void validarComplementos(PessoaCreateDto d, boolean fisica) {
        if (!fisica) {
            if (d.dataAbertura() != null && d.dataAbertura().isBefore(ABERTURA_MINIMA)) {
                throw new CampoInvalidoException("dataAbertura", "Data de abertura inválida.");
            }
            return;
        }
        String orgao = PessoaMapper.normalizarOrgaoEmissor(d.rgOrgaoEmissor());
        if (PessoaMapper.normalizarRg(d.rg()) == null
                && (orgao != null || d.rgEstadoId() != null || d.rgDataEmissao() != null)) {
            throw new CampoInvalidoException("rg", "Informe o número do RG.");
        }
        if (orgao != null && !ORGAO_EMISSOR.matcher(orgao).matches()) {
            throw new CampoInvalidoException("rgOrgaoEmissor", "Órgão emissor inválido.");
        }
        if (d.rgDataEmissao() != null) {
            if (d.rgDataEmissao().isBefore(NASCIMENTO_MINIMO)) {
                throw new CampoInvalidoException("rgDataEmissao", "Data de emissão inválida.");
            }
            if (d.dataNascimento() != null && d.rgDataEmissao().isBefore(d.dataNascimento())) {
                throw new CampoInvalidoException("rgDataEmissao", "A emissão não pode ser anterior ao nascimento.");
            }
        }

        // CNH (decisão do dono, 20/11/2026): o número pode ir sozinho; categoria e validade
        // são opcionais e só existem com ele; vencida é aceita.
        String cnh = PessoaMapper.normalizarCnh(d.cnh());
        if (cnh == null && (d.cnhCategoria() != null || d.cnhValidade() != null)) {
            throw new CampoInvalidoException("cnh", "Informe o número da CNH.");
        }
        if (cnh != null && !DocumentoValidator.cnhValida(cnh)) {
            throw new CampoInvalidoException("cnh", "CNH inválida.");
        }
        if (d.cnhValidade() != null && (d.cnhValidade().isBefore(NASCIMENTO_MINIMO)
                || d.cnhValidade().isAfter(LocalDate.now().plusYears(VALIDADE_CNH_ANOS)))) {
            throw new CampoInvalidoException("cnhValidade", "Validade da CNH inválida.");
        }

        String nacionalidade = PessoaMapper.textoOuNulo(d.nacionalidade());
        if (nacionalidade != null && nacionalidade.length() < 2) {
            throw new CampoInvalidoException("nacionalidade", "Nacionalidade deve ter de 2 a 40 caracteres.");
        }
    }

    /** Dígito verificador e repetido no contratante. O 409 diz o código de quem já tem o documento. */
    private void validarDocumentos(PessoaCreateDto d, boolean fisica, UUID ignorarId) {
        if (fisica) {
            String cpf = DocumentoValidator.normalizar(d.cpf());
            if (cpf == null) {
                return;
            }
            if (!DocumentoValidator.cpfValido(cpf)) {
                throw new CampoInvalidoException("cpf", "CPF inválido.");
            }
            repository.buscarCodigoPorCpf(cpf, ignorarId).ifPresent(cod -> {
                throw new ConflitoCampoException("cpf", "CPF já cadastrado (código " + cod + ").");
            });
        } else {
            String cnpj = DocumentoValidator.normalizar(d.cnpj());
            if (cnpj == null) {
                return;
            }
            if (!DocumentoValidator.cnpjValido(cnpj)) {
                throw new CampoInvalidoException("cnpj", "CNPJ inválido.");
            }
            repository.buscarCodigoPorCnpj(cnpj, ignorarId).ifPresent(cod -> {
                throw new ConflitoCampoException("cnpj", "CNPJ já cadastrado (código " + cod + ").");
            });
        }
    }

    /** Piso e teto que o DTO não vê porque dependem da normalização (máscara fora). */
    private static void validarTamanhos(PessoaCreateDto d, boolean fisica) {
        if (fisica) {
            String rg = PessoaMapper.normalizarRg(d.rg());
            if (rg != null && (rg.length() < 6 || rg.length() > 10)) {
                throw new CampoInvalidoException("rg", "RG deve ter de 6 a 10 caracteres.");
            }
            if (d.dataNascimento() != null && d.dataNascimento().isBefore(NASCIMENTO_MINIMO)) {
                throw new CampoInvalidoException("dataNascimento", "Data de nascimento inválida.");
            }
            return;
        }
        exigirInscricao(d.inscricaoEstadual(), "inscricaoEstadual", "Inscrição estadual deve ter de 5 a 12 dígitos.");
        exigirInscricao(d.inscricaoMunicipal(), "inscricaoMunicipal", "Inscrição municipal deve ter de 5 a 12 dígitos.");
    }

    /**
     * Vínculos ({@code vinculos[i]}): nunca consigo mesma, sem repetir a pessoa, só pessoa do
     * contratante (travada), inativa só se já estava vinculada, Contato ↔ Empresa só com a
     * empresa pessoa jurídica, e Representante legal ↔ Empresa representada só com o
     * representante pessoa física e a representada pessoa jurídica (P1, 20/11/2026).
     */
    private static void validarVinculos(List<PessoaVinculoItemDto> vinculos, Pessoa atual, boolean fisica,
                                        Map<UUID, Pessoa> travadas, Set<UUID> jaVinculadas) {
        Set<UUID> vistas = new HashSet<>();
        for (int i = 0; i < vinculos.size(); i++) {
            PessoaVinculoItemDto v = vinculos.get(i);
            String campo = "vinculos[" + i + "].pessoaId";
            if (atual != null && v.pessoaId().equals(atual.getId())) {
                throw new CampoInvalidoException(campo, "Uma pessoa não pode ser vinculada a ela mesma.");
            }
            if (!vistas.add(v.pessoaId())) {
                throw new CampoInvalidoException(campo, "Esta pessoa já está na lista.");
            }
            Pessoa outra = travadas.get(v.pessoaId());
            if (outra == null) {
                throw new CampoInvalidoException(campo, MSG_NAO_ENCONTRADA);
            }
            if (!outra.isAtivo() && !jaVinculadas.contains(outra.getId())) {
                throw new CampoInvalidoException(campo, "Esta pessoa está inativa.");
            }
            if (v.tipo() == TipoVinculo.EMPRESA && outra.getTipoPessoa() != TipoPessoa.JURIDICA) {
                throw new CampoInvalidoException("vinculos[" + i + "].tipo", "A empresa precisa ser pessoa jurídica.");
            }
            if (v.tipo() == TipoVinculo.CONTATO && fisica) {
                throw new CampoInvalidoException("vinculos[" + i + "].tipo", "Só pessoa jurídica tem contato.");
            }
            validarRepresentante(v.tipo(), fisica, outra, "vinculos[" + i + "].tipo");
        }
    }

    /**
     * "A outra é REPRESENTANTE_LEGAL desta": esta é a empresa (PJ) e a outra, o representante
     * (PF). "A outra é REPRESENTADA desta": o contrário.
     */
    private static void validarRepresentante(TipoVinculo tipo, boolean fisica, Pessoa outra, String campo) {
        boolean outraFisica = outra.getTipoPessoa() == TipoPessoa.FISICA;
        if (tipo == TipoVinculo.REPRESENTANTE_LEGAL) {
            if (fisica) {
                throw new CampoInvalidoException(campo, "Só pessoa jurídica tem representante legal.");
            }
            if (!outraFisica) {
                throw new CampoInvalidoException(campo, MSG_REPRESENTANTE_PF);
            }
        } else if (tipo == TipoVinculo.REPRESENTADA) {
            if (outraFisica) {
                throw new CampoInvalidoException(campo, "A empresa representada precisa ser pessoa jurídica.");
            }
            if (!fisica) {
                throw new CampoInvalidoException(campo, MSG_REPRESENTANTE_PF);
            }
        }
    }

    /** Os tipos que a pessoa já usava em cada lista: o inativo só passa se já estava gravado. */
    private record Anteriores(Set<UUID> tiposCadastro, Set<UUID> telefones, Set<UUID> emails,
                              Set<UUID> redesSociais, Set<UUID> enderecos) {
        static final Anteriores NENHUM = new Anteriores(Set.of(), Set.of(), Set.of(), Set.of(), Set.of());
    }

    private Anteriores anteriores(UUID pessoaId) {
        return new Anteriores(
                ids(tipoCadastroRepository.buscarPorPessoa(pessoaId), x -> x.getTipoCadastro().getId()),
                ids(telefoneRepository.buscarPorPessoa(pessoaId), t -> t.getTipoTelefone().getId()),
                ids(emailRepository.buscarPorPessoa(pessoaId), e -> e.getTipoEmail().getId()),
                ids(redeSocialRepository.buscarPorPessoa(pessoaId), r -> r.getTipoRedeSocial().getId()),
                ids(enderecoRepository.buscarPorPessoa(pessoaId), e -> e.getTipoEndereco().getId()));
    }

    /** Resposta de uma pessoa só (ficha, criar, alterar): filhas, vínculos e os nomes da auditoria. */
    private PessoaResponseDto montarResposta(Pessoa p) {
        UUID id = p.getId();
        Set<UUID> autores = Stream.of(p.getCreatedBy(), p.getUpdatedBy()).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return PessoaMapper.toResponseDto(p,
                tipoCadastroRepository.buscarPorPessoa(id),
                telefoneRepository.buscarPorPessoa(id),
                emailRepository.buscarPorPessoa(id),
                redeSocialRepository.buscarPorPessoa(id),
                enderecoRepository.buscarPorPessoa(id),
                vinculoService.buscarDaPessoa(id),
                usuarioService.buscarNomes(autores),
                PLATAFORMA);
    }

    /** Trava em ordem de id (a consulta ordena). Devolve só as do contratante. */
    private Map<UUID, Pessoa> travar(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Pessoa> travadas = new LinkedHashMap<>();
        repository.travarPorIds(ids).forEach(p -> travadas.put(p.getId(), p));
        return travadas;
    }

    /** O vínculo destas pessoas mudou pelo cadastro de outra: a versão delas sobe. */
    private void marcarAlteradasPorVinculo(Set<UUID> ids) {
        if (!ids.isEmpty()) {
            repository.marcarAlteradaPorVinculo(ids, Instant.now(), SecurityUtils.getUsuarioIdLogado());
        }
    }

    private static Set<UUID> outrasPessoas(List<PessoaVinculo> vinculos, UUID pessoaId) {
        return vinculos.stream().map(v -> PessoaMapper.outraPessoa(v, pessoaId).getId()).collect(Collectors.toSet());
    }

    private static Set<UUID> idsDosVinculos(List<PessoaVinculoItemDto> vinculos) {
        return lista(vinculos).stream().map(PessoaVinculoItemDto::pessoaId).collect(Collectors.toSet());
    }

    private static <T> void exigirTipo(Map<UUID, T> encontrados, UUID tipoId, Set<UUID> jaTinha, Predicate<T> ativo,
                                    String campo, String nomeDoTipo) {
        T tipo = encontrados.get(tipoId);
        if (tipo == null) {
            throw new CampoInvalidoException(campo, nomeDoTipo + " não encontrado.");
        }
        if (!ativo.test(tipo) && !jaTinha.contains(tipoId)) {
            throw new CampoInvalidoException(campo, nomeDoTipo + " inativo.");
        }
    }

    private static void exigirNoMaximoUmPrincipal(Stream<Boolean> marcados, String campo, String mensagem) {
        if (marcados.filter(Boolean.TRUE::equals).count() > 1) {
            throw new CampoInvalidoException(campo, mensagem);
        }
    }

    /** O marcado como principal; nenhum marcado = o primeiro (lista vazia: nenhum). */
    private static int indicePrincipal(List<Boolean> marcados) {
        int i = marcados.indexOf(Boolean.TRUE);
        return i < 0 ? 0 : i;
    }

    private static void exigirInscricao(String valor, String campo, String mensagem) {
        String inscricao = PessoaMapper.normalizarInscricao(valor);
        if (inscricao != null && !inscricao.matches("\\d{5,12}")) {
            throw new CampoInvalidoException(campo, mensagem);
        }
    }

    private static void recusarPreenchido(String valor, String campo, String mensagem) {
        if (valor != null && !valor.isBlank()) {
            throw new CampoInvalidoException(campo, mensagem);
        }
    }

    private static void recusarInformado(Object valor, String campo, String mensagem) {
        if (valor != null) {
            throw new CampoInvalidoException(campo, mensagem);
        }
    }

    private static <T> Set<UUID> ids(List<T> itens, Function<T, UUID> id) {
        return itens.stream().map(id).collect(Collectors.toSet());
    }

    private static <T> Map<UUID, T> porPessoa(List<T> itens, Function<T, Pessoa> pessoa) {
        return itens.stream().collect(Collectors.toMap(i -> pessoa.apply(i).getId(), Function.identity()));
    }

    private static <T> List<T> lista(List<T> itens) {
        return itens == null ? List.of() : itens;
    }
}
