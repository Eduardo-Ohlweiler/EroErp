package com.api.ero_api.pessoa.mapper;

import com.api.ero_api.auxiliar.dtos.TipoCadastroSelectDto;
import com.api.ero_api.auxiliar.entity.EstadoCivil;
import com.api.ero_api.auxiliar.entity.Profissao;
import com.api.ero_api.auxiliar.entity.TipoCadastro;
import com.api.ero_api.auxiliar.entity.TipoEmail;
import com.api.ero_api.auxiliar.entity.TipoEndereco;
import com.api.ero_api.auxiliar.entity.TipoRedeSocial;
import com.api.ero_api.auxiliar.entity.TipoTelefone;
import com.api.ero_api.auxiliar.mapper.EstadoCivilMapper;
import com.api.ero_api.auxiliar.mapper.ProfissaoMapper;
import com.api.ero_api.auxiliar.mapper.TipoCadastroMapper;
import com.api.ero_api.auxiliar.mapper.TipoEmailMapper;
import com.api.ero_api.auxiliar.mapper.TipoEnderecoMapper;
import com.api.ero_api.auxiliar.mapper.TipoRedeSocialMapper;
import com.api.ero_api.auxiliar.mapper.TipoTelefoneMapper;
import com.api.ero_api.compartilhado.util.DocumentoValidator;
import com.api.ero_api.compartilhado.util.TextoBusca;
import com.api.ero_api.localidade.entity.Cidade;
import com.api.ero_api.localidade.entity.Estado;
import com.api.ero_api.localidade.mapper.LocalidadeMapper;
import com.api.ero_api.pessoa.dtos.PessoaCreateDto;
import com.api.ero_api.pessoa.dtos.PessoaEmailItemDto;
import com.api.ero_api.pessoa.dtos.PessoaEmailResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaEnderecoItemDto;
import com.api.ero_api.pessoa.dtos.PessoaEnderecoResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaListaDto;
import com.api.ero_api.pessoa.dtos.PessoaRedeSocialItemDto;
import com.api.ero_api.pessoa.dtos.PessoaRedeSocialResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaSelectDto;
import com.api.ero_api.pessoa.dtos.PessoaTelefoneItemDto;
import com.api.ero_api.pessoa.dtos.PessoaTelefoneResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_api.pessoa.dtos.PessoaVinculoResponseDto;
import com.api.ero_api.pessoa.entity.Pessoa;
import com.api.ero_api.pessoa.entity.PessoaEmail;
import com.api.ero_api.pessoa.entity.PessoaEndereco;
import com.api.ero_api.pessoa.entity.PessoaRedeSocial;
import com.api.ero_api.pessoa.entity.PessoaTelefone;
import com.api.ero_api.pessoa.entity.PessoaTipoCadastro;
import com.api.ero_api.pessoa.entity.PessoaVinculo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import com.api.ero_api.pessoa.enums.TipoVinculo;
import com.api.ero_api.pessoa.util.OrdemUuid;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Conversão entidade ↔ DTO da pessoa e das filhas, à mão e sem regra de negócio. O que é
 * regra (documento válido, tipo inativo, principal, vínculo permitido) fica no service.
 *
 * <ul>
 *   <li>a entrada é normalizada aqui: {@code trim}, vazio vira {@code null}, documentos
 *       pelo {@link DocumentoValidator#normalizar}, RG em maiúsculas sem ponto, hífen nem
 *       espaço, órgão emissor em maiúsculas, CNH só com os dígitos, inscrições sem
 *       máscara, e-mail minúsculo;</li>
 *   <li>o campo do outro tipo de pessoa é gravado {@code null} (o service recusa antes
 *       quando ele vem preenchido);</li>
 *   <li>o código ({@code codPessoa}) nunca é copiado da entrada.</li>
 * </ul>
 */
public final class PessoaMapper {

    private static final Comparator<String> POR_NOME = Comparator.comparing(
            n -> n == null ? "" : TextoBusca.normalizar(n), Comparator.nullsFirst(Comparator.naturalOrder()));

    private PessoaMapper() {
    }

    // ---------------------------------------------------------------- entrada

    /** O PUT tem os mesmos campos do POST mais a versão: as regras do service olham um formato só. */
    public static PessoaCreateDto dados(PessoaUpdateDto dto) {
        return new PessoaCreateDto(dto.tipoPessoa(), dto.nome(), dto.cpf(), dto.rg(), dto.dataNascimento(),
                dto.sexo(), dto.rgOrgaoEmissor(), dto.rgEstadoId(), dto.rgDataEmissao(), dto.cnh(),
                dto.cnhCategoria(), dto.cnhValidade(), dto.estadoCivilId(), dto.profissaoId(), dto.nacionalidade(),
                dto.naturalidadeId(), dto.nomeMae(), dto.nomePai(), dto.cnpj(), dto.nomeFantasia(),
                dto.inscricaoEstadual(), dto.inscricaoMunicipal(), dto.dataAbertura(), dto.observacao(),
                dto.tiposCadastroIds(), dto.telefones(), dto.emails(), dto.redesSociais(), dto.enderecos(),
                dto.vinculos());
    }

    /**
     * {@code rgEstado}, {@code estadoCivil}, {@code profissao} e {@code naturalidade}: as
     * referências que o DTO traz por id, já conferidas pelo service ({@code null} = não informada).
     */
    public static Pessoa toEntity(PessoaCreateDto dto, Estado rgEstado, EstadoCivil estadoCivil, Profissao profissao,
                                  Cidade naturalidade) {
        Pessoa p = new Pessoa();
        preencher(p, dto, rgEstado, estadoCivil, profissao, naturalidade);
        p.setAtivo(true);
        return p;
    }

    /** Trocar o tipo limpa os campos do anterior. O código e a situação não mudam aqui. */
    public static void atualizarEntidade(Pessoa p, PessoaUpdateDto dto, Estado rgEstado, EstadoCivil estadoCivil,
                                         Profissao profissao, Cidade naturalidade) {
        preencher(p, dados(dto), rgEstado, estadoCivil, profissao, naturalidade);
    }

    /** {@code nome_busca}: nome e fantasia sem acento e sem caixa (a busca da lista e do combo). */
    public static void nomeBusca(Pessoa p) {
        String fantasia = p.getNomeFantasia() == null ? "" : " " + p.getNomeFantasia();
        p.setNomeBusca(TextoBusca.normalizar(p.getNome() + fantasia));
    }

    /** RG em maiúsculas, sem ponto, hífen nem espaço; vazio vira {@code null}. */
    public static String normalizarRg(String rg) {
        return textoOuNulo(rg == null ? null : rg.toUpperCase(Locale.ROOT).replaceAll("[.\\-\\s]", ""));
    }

    /** Órgão emissor do RG em maiúsculas ("ssp" → "SSP"); vazio vira {@code null}. */
    public static String normalizarOrgaoEmissor(String orgao) {
        return textoOuNulo(orgao == null ? null : orgao.toUpperCase(Locale.ROOT));
    }

    /** CNH sem ponto, hífen nem espaço; vazio vira {@code null}. Letras ficam: o service recusa (DV). */
    public static String normalizarCnh(String cnh) {
        return textoOuNulo(cnh == null ? null : cnh.replaceAll("[.\\-\\s]", ""));
    }

    /** Inscrição sem a máscara (ponto, hífen, barra, espaço); vazio vira {@code null}. Letras ficam: o service recusa. */
    public static String normalizarInscricao(String inscricao) {
        return textoOuNulo(inscricao == null ? null : inscricao.replaceAll("[.\\-/\\s]", ""));
    }

    /** {@code trim}; só espaços ou vazio vira {@code null}. */
    public static String textoOuNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    public static PessoaTipoCadastro tipoCadastro(Pessoa p, TipoCadastro tipo) {
        PessoaTipoCadastro x = new PessoaTipoCadastro();
        x.setPessoa(p);
        x.setTipoCadastro(tipo);
        return x;
    }

    public static PessoaTelefone telefone(PessoaTelefoneItemDto item, Pessoa p, TipoTelefone tipo, int ordem,
                                          boolean principal) {
        PessoaTelefone t = new PessoaTelefone();
        t.setPessoa(p);
        t.setOrdem(ordem);
        t.setTipoTelefone(tipo);
        t.setNumero(item.numero().trim());
        t.setObservacao(textoOuNulo(item.observacao()));
        t.setPrincipal(principal);
        return t;
    }

    public static PessoaEmail email(PessoaEmailItemDto item, Pessoa p, TipoEmail tipo, int ordem, boolean principal) {
        PessoaEmail e = new PessoaEmail();
        e.setPessoa(p);
        e.setOrdem(ordem);
        e.setTipoEmail(tipo);
        e.setEmail(item.email().trim().toLowerCase(Locale.ROOT));
        e.setObservacao(textoOuNulo(item.observacao()));
        e.setPrincipal(principal);
        return e;
    }

    public static PessoaRedeSocial redeSocial(PessoaRedeSocialItemDto item, Pessoa p, TipoRedeSocial tipo, int ordem) {
        PessoaRedeSocial r = new PessoaRedeSocial();
        r.setPessoa(p);
        r.setOrdem(ordem);
        r.setTipoRedeSocial(tipo);
        r.setUsuario(textoOuNulo(item.usuario()));
        r.setUrl(textoOuNulo(item.url()));
        return r;
    }

    public static PessoaEndereco endereco(PessoaEnderecoItemDto item, Pessoa p, TipoEndereco tipo, Cidade cidade,
                                          int ordem, boolean principal) {
        PessoaEndereco e = new PessoaEndereco();
        e.setPessoa(p);
        e.setOrdem(ordem);
        e.setTipoEndereco(tipo);
        e.setCep(textoOuNulo(item.cep()));
        e.setCidade(cidade);
        e.setRua(textoOuNulo(item.rua()));
        e.setNumero(textoOuNulo(item.numero()));
        e.setBairro(textoOuNulo(item.bairro()));
        e.setComplemento(textoOuNulo(item.complemento()));
        e.setPrincipal(principal);
        return e;
    }

    /**
     * Linha nova de vínculo, já na orientação canônica: "{@code outra} é {@code naVisaoDeP}
     * de {@code p}". Se {@code p} vem antes no banco a linha é (p, outra, tipo); senão é
     * (outra, p, tipo.inverso()), que diz a mesma coisa vista do outro lado.
     */
    public static PessoaVinculo vinculo(Pessoa p, Pessoa outra, TipoVinculo naVisaoDeP, String observacao) {
        PessoaVinculo v = new PessoaVinculo();
        boolean pAntes = OrdemUuid.antes(p.getId(), outra.getId());
        v.setPessoaOrigem(pAntes ? p : outra);
        v.setPessoaDestino(pAntes ? outra : p);
        v.setTipo(pAntes ? naVisaoDeP : naVisaoDeP.inverso());
        v.setObservacao(textoOuNulo(observacao));
        return v;
    }

    /** Muda tipo e observação de uma linha existente, mantendo a orientação dela. */
    public static void atualizarVinculo(PessoaVinculo v, UUID pessoaId, TipoVinculo naVisaoDaPessoa, String observacao) {
        boolean origem = v.getPessoaOrigem().getId().equals(pessoaId);
        v.setTipo(origem ? naVisaoDaPessoa : naVisaoDaPessoa.inverso());
        v.setObservacao(textoOuNulo(observacao));
    }

    /** A outra pessoa do vínculo, vista de {@code pessoaId}. */
    public static Pessoa outraPessoa(PessoaVinculo v, UUID pessoaId) {
        return v.getPessoaOrigem().getId().equals(pessoaId) ? v.getPessoaDestino() : v.getPessoaOrigem();
    }

    /** O que a outra pessoa é de {@code pessoaId}. */
    public static TipoVinculo tipoNaVisaoDe(PessoaVinculo v, UUID pessoaId) {
        return v.getPessoaOrigem().getId().equals(pessoaId) ? v.getTipo() : v.getTipo().inverso();
    }

    // ---------------------------------------------------------------- saída

    /**
     * Ficha completa. As filhas já vêm na ordem gravada (com o tipo junto); tipos de
     * cadastro e vínculos são ordenados por nome aqui. {@code nomes}/{@code plataforma}:
     * auditoria como no {@code UsuarioMapper}.
     */
    public static PessoaResponseDto toResponseDto(Pessoa p, List<PessoaTipoCadastro> tipos,
                                                  List<PessoaTelefone> telefones, List<PessoaEmail> emails,
                                                  List<PessoaRedeSocial> redes, List<PessoaEndereco> enderecos,
                                                  List<PessoaVinculo> vinculos, Map<UUID, String> nomes,
                                                  boolean plataforma) {
        return new PessoaResponseDto(
                p.getId(),
                p.getCodPessoa(),
                p.getTipoPessoa(),
                p.getNome(),
                p.getNomeFantasia(),
                p.getCpf(),
                p.getRg(),
                p.getDataNascimento(),
                p.getSexo(),
                p.getRgOrgaoEmissor(),
                p.getRgEstado() == null ? null : LocalidadeMapper.toEstadoSelectDto(p.getRgEstado()),
                p.getRgDataEmissao(),
                p.getCnh(),
                p.getCnhCategoria(),
                p.getCnhValidade(),
                p.getEstadoCivil() == null ? null : EstadoCivilMapper.toSelectDto(p.getEstadoCivil()),
                p.getProfissao() == null ? null : ProfissaoMapper.toSelectDto(p.getProfissao()),
                p.getNacionalidade(),
                p.getNaturalidade() == null ? null : LocalidadeMapper.toSelectDto(p.getNaturalidade()),
                p.getNomeMae(),
                p.getNomePai(),
                p.getCnpj(),
                p.getInscricaoEstadual(),
                p.getInscricaoMunicipal(),
                p.getDataAbertura(),
                p.getObservacao(),
                p.isAtivo(),
                tiposCadastro(tipos),
                telefones.stream().map(PessoaMapper::toTelefoneResponseDto).toList(),
                emails.stream().map(PessoaMapper::toEmailResponseDto).toList(),
                redes.stream().map(PessoaMapper::toRedeSocialResponseDto).toList(),
                enderecos.stream().map(PessoaMapper::toEnderecoResponseDto).toList(),
                vinculos.stream()
                        .map(v -> toVinculoResponseDto(v, p.getId()))
                        .sorted(Comparator.comparing(v -> v.pessoa().nome(), POR_NOME))
                        .toList(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                visivel(nomes, p.getCreatedBy(), plataforma),
                visivel(nomes, p.getUpdatedBy(), plataforma),
                nome(nomes, p.getCreatedBy()),
                nome(nomes, p.getUpdatedBy()),
                p.getVersion());
    }

    /** Linha da lista: os principais podem faltar ({@code null}). */
    public static PessoaListaDto toListaDto(Pessoa p, List<PessoaTipoCadastro> tipos, PessoaTelefone telefone,
                                            PessoaEmail email, PessoaEndereco endereco) {
        return new PessoaListaDto(
                p.getId(),
                p.getCodPessoa(),
                p.getTipoPessoa(),
                p.getNome(),
                p.getNomeFantasia(),
                p.getTipoPessoa() == TipoPessoa.FISICA ? p.getCpf() : p.getCnpj(),
                tiposCadastro(tipos),
                telefone == null ? null : telefone.getNumero(),
                email == null ? null : email.getEmail(),
                endereco == null ? null : endereco.getCidade().getNome(),
                endereco == null ? null : endereco.getCidade().getEstado().getSigla(),
                p.isAtivo());
    }

    public static PessoaSelectDto toSelectDto(Pessoa p) {
        return new PessoaSelectDto(p.getId(), p.getCodPessoa(), p.getNome());
    }

    /** O vínculo visto da pessoa aberta: a outra pessoa e o tipo na visão desta. */
    public static PessoaVinculoResponseDto toVinculoResponseDto(PessoaVinculo v, UUID aberta) {
        Pessoa outra = outraPessoa(v, aberta);
        return new PessoaVinculoResponseDto(toSelectDto(outra), outra.isAtivo(), tipoNaVisaoDe(v, aberta),
                v.getObservacao());
    }

    public static PessoaTelefoneResponseDto toTelefoneResponseDto(PessoaTelefone t) {
        return new PessoaTelefoneResponseDto(TipoTelefoneMapper.toSelectDto(t.getTipoTelefone()), t.getNumero(),
                t.getObservacao(), t.isPrincipal());
    }

    public static PessoaEmailResponseDto toEmailResponseDto(PessoaEmail e) {
        return new PessoaEmailResponseDto(TipoEmailMapper.toSelectDto(e.getTipoEmail()), e.getEmail(),
                e.getObservacao(), e.isPrincipal());
    }

    public static PessoaRedeSocialResponseDto toRedeSocialResponseDto(PessoaRedeSocial r) {
        return new PessoaRedeSocialResponseDto(TipoRedeSocialMapper.toSelectDto(r.getTipoRedeSocial()), r.getUsuario(),
                r.getUrl());
    }

    public static PessoaEnderecoResponseDto toEnderecoResponseDto(PessoaEndereco e) {
        return new PessoaEnderecoResponseDto(TipoEnderecoMapper.toSelectDto(e.getTipoEndereco()), e.getCep(),
                LocalidadeMapper.toSelectDto(e.getCidade()), e.getRua(), e.getNumero(), e.getBairro(),
                e.getComplemento(), e.isPrincipal());
    }

    // ---------------------------------------------------------------- apoio

    private static void preencher(Pessoa p, PessoaCreateDto dto, Estado rgEstado, EstadoCivil estadoCivil,
                                  Profissao profissao, Cidade naturalidade) {
        boolean fisica = dto.tipoPessoa() == TipoPessoa.FISICA;
        p.setTipoPessoa(dto.tipoPessoa());
        p.setNome(dto.nome().trim());
        p.setObservacao(textoOuNulo(dto.observacao()));
        p.setCpf(fisica ? DocumentoValidator.normalizar(dto.cpf()) : null);
        p.setRg(fisica ? normalizarRg(dto.rg()) : null);
        p.setDataNascimento(fisica ? dto.dataNascimento() : null);
        p.setSexo(fisica ? dto.sexo() : null);
        p.setRgOrgaoEmissor(fisica ? normalizarOrgaoEmissor(dto.rgOrgaoEmissor()) : null);
        p.setRgEstado(fisica ? rgEstado : null);
        p.setRgDataEmissao(fisica ? dto.rgDataEmissao() : null);
        p.setCnh(fisica ? normalizarCnh(dto.cnh()) : null);
        p.setCnhCategoria(fisica ? dto.cnhCategoria() : null);
        p.setCnhValidade(fisica ? dto.cnhValidade() : null);
        p.setEstadoCivil(fisica ? estadoCivil : null);
        p.setProfissao(fisica ? profissao : null);
        p.setNacionalidade(fisica ? textoOuNulo(dto.nacionalidade()) : null);
        p.setNaturalidade(fisica ? naturalidade : null);
        p.setNomeMae(fisica ? textoOuNulo(dto.nomeMae()) : null);
        p.setNomePai(fisica ? textoOuNulo(dto.nomePai()) : null);
        p.setCnpj(fisica ? null : DocumentoValidator.normalizar(dto.cnpj()));
        p.setNomeFantasia(fisica ? null : textoOuNulo(dto.nomeFantasia()));
        p.setInscricaoEstadual(fisica ? null : normalizarInscricao(dto.inscricaoEstadual()));
        p.setInscricaoMunicipal(fisica ? null : normalizarInscricao(dto.inscricaoMunicipal()));
        p.setDataAbertura(fisica ? null : dto.dataAbertura());
    }

    private static List<TipoCadastroSelectDto> tiposCadastro(List<PessoaTipoCadastro> tipos) {
        return tipos.stream()
                .map(PessoaTipoCadastro::getTipoCadastro)
                .map(TipoCadastroMapper::toSelectDto)
                .sorted(Comparator.comparing(TipoCadastroSelectDto::nome, POR_NOME))
                .toList();
    }

    private static String nome(Map<UUID, String> nomes, UUID id) {
        return id == null ? null : nomes.get(id);
    }

    /** Fora da visão de plataforma, só sai o id de quem tem nome visível daqui (o superadmin não tem). */
    private static UUID visivel(Map<UUID, String> nomes, UUID id, boolean plataforma) {
        return plataforma || id == null || nomes.containsKey(id) ? id : null;
    }
}
