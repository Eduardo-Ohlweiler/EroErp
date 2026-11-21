package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.EstadoCivil;
import com.api.ero_api.auxiliar.entity.Profissao;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.localidade.entity.Cidade;
import com.api.ero_api.localidade.entity.Estado;
import com.api.ero_api.pessoa.enums.CategoriaCnh;
import com.api.ero_api.pessoa.enums.Sexo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;

/**
 * Pessoa física ou jurídica do contratante (o primeiro cadastro de negócio).
 *
 * <p>Sem coleções de propósito: tipos de cadastro, telefones, e-mails, redes sociais,
 * endereços e vínculos são lidos pelos repositories deles, em lote, e a lista que chega
 * no salvar substitui a anterior. CPF, RG, CNH, nascimento, filiação, estado civil e
 * contatos são dados pessoais: nunca em log (a classe não tem {@code toString} com campos).
 *
 * <p>UF do RG, estado civil, profissão e naturalidade são {@code LAZY}: a lista não os lê,
 * e a ficha os lê dentro da transação. O {@code travarPorIds} continua sem fetch (o
 * PostgreSQL recusa {@code FOR UPDATE} no lado nulo de um outer join).
 */
@Entity
@Table(name = "pessoa")
@DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
public class Pessoa extends TenantEntity {

    /** Código por contratante (maior + 1, ver docs/01). Nunca muda nem vem na entrada. */
    @Column(name = "cod_pessoa", nullable = false, updatable = false)
    private Long codPessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", nullable = false, length = 10)
    private TipoPessoa tipoPessoa;

    /** Nome da pessoa física ou razão social da jurídica. */
    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    /** Só pessoa jurídica. */
    @Column(name = "nome_fantasia", length = 255)
    private String nomeFantasia;

    /** {@code TextoBusca.normalizar(nome + " " + fantasia)}: a busca é sem acento e sem caixa. */
    @Column(name = "nome_busca", nullable = false, length = 511)
    private String nomeBusca;

    /** Só pessoa física. 11 dígitos, único no contratante. */
    @Column(name = "cpf", length = 11)
    private String cpf;

    /** Só pessoa física. Maiúsculas, sem ponto, hífen nem espaço; não é único. */
    @Column(name = "rg", length = 20)
    private String rg;

    /** Só pessoa física. */
    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    /** Só pessoa física; nulo = não informado. */
    @Enumerated(EnumType.STRING)
    @Column(name = "sexo", length = 10)
    private Sexo sexo;

    /** Só pessoa física, e só com o RG. Maiúsculas ("SSP", "DETRAN"). */
    @Column(name = "rg_orgao_emissor", length = 15)
    private String rgOrgaoEmissor;

    /** Só pessoa física, e só com o RG. A UF do órgão emissor. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rg_estado_id")
    private Estado rgEstado;

    /** Só pessoa física, e só com o RG. */
    @Column(name = "rg_data_emissao")
    private LocalDate rgDataEmissao;

    /** Só pessoa física. 11 dígitos (DV conferido no service); não é única. Dado pessoal: nunca em log. */
    @Column(name = "cnh", length = 11)
    private String cnh;

    /** Só pessoa física, e só com o número da CNH (opcional). */
    @Enumerated(EnumType.STRING)
    @Column(name = "cnh_categoria", length = 2)
    private CategoriaCnh cnhCategoria;

    /** Só pessoa física, e só com o número da CNH (opcional). Vencida é aceita. */
    @Column(name = "cnh_validade")
    private LocalDate cnhValidade;

    /** Só pessoa física. Cadastro auxiliar do contratante. Dado pessoal: nunca em log. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estado_civil_id")
    private EstadoCivil estadoCivil;

    /** Só pessoa física. Cadastro auxiliar do contratante. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profissao_id")
    private Profissao profissao;

    /** Só pessoa física. Texto livre ("Brasileira"). */
    @Column(name = "nacionalidade", length = 40)
    private String nacionalidade;

    /** Só pessoa física. A cidade (IBGE) onde nasceu. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "naturalidade_id")
    private Cidade naturalidade;

    /** Só pessoa física. Filiação, dado pessoal: nunca em log. */
    @Column(name = "nome_mae", length = 255)
    private String nomeMae;

    /** Só pessoa física. Filiação, dado pessoal: nunca em log. */
    @Column(name = "nome_pai", length = 255)
    private String nomePai;

    /** Só pessoa jurídica. 14 posições (aceita o CNPJ alfanumérico), único no contratante. */
    @Column(name = "cnpj", length = 14)
    private String cnpj;

    /** Só pessoa jurídica. Só dígitos. */
    @Column(name = "inscricao_estadual", length = 12)
    private String inscricaoEstadual;

    /** Só pessoa jurídica. Só dígitos. */
    @Column(name = "inscricao_municipal", length = 12)
    private String inscricaoMunicipal;

    /** Só pessoa jurídica. */
    @Column(name = "data_abertura")
    private LocalDate dataAbertura;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;
}
