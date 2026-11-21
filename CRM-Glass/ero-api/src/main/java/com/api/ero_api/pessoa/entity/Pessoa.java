package com.api.ero_api.pessoa.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.pessoa.enums.Sexo;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * no salvar substitui a anterior. CPF, RG, nascimento e contatos são dados pessoais:
 * nunca em log (a classe não tem {@code toString} com campos).
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

    /** Só pessoa jurídica. 14 posições (aceita o CNPJ alfanumérico), único no contratante. */
    @Column(name = "cnpj", length = 14)
    private String cnpj;

    /** Só pessoa jurídica. Só dígitos. */
    @Column(name = "inscricao_estadual", length = 12)
    private String inscricaoEstadual;

    /** Só pessoa jurídica. Só dígitos. */
    @Column(name = "inscricao_municipal", length = 12)
    private String inscricaoMunicipal;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;
}
