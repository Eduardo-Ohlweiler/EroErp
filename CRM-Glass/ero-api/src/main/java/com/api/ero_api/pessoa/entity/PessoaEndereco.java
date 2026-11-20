package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.TipoEndereco;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.localidade.entity.Cidade;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Endereço da pessoa. Dado pessoal: nunca em log. A lista do salvar substitui a anterior. */
@Entity
@Table(name = "pessoa_endereco")
@Getter
@Setter
@NoArgsConstructor
public class PessoaEndereco extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, updatable = false)
    private Pessoa pessoa;

    /** Posição na lista (0 = primeiro). */
    @Column(name = "ordem", nullable = false)
    private int ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_endereco_id", nullable = false)
    private TipoEndereco tipoEndereco;

    /** 8 dígitos ou nulo. */
    @Column(name = "cep", length = 8)
    private String cep;

    /** Município do IBGE (dado de referência, sem tenant). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cidade_id", nullable = false)
    private Cidade cidade;

    @Column(name = "rua", length = 255)
    private String rua;

    @Column(name = "numero", length = 20)
    private String numero;

    @Column(name = "bairro", length = 100)
    private String bairro;

    @Column(name = "complemento", length = 100)
    private String complemento;

    /** No máximo um por pessoa ({@code uk_pessoa_endereco_principal}). */
    @Column(name = "principal", nullable = false)
    private boolean principal;
}
