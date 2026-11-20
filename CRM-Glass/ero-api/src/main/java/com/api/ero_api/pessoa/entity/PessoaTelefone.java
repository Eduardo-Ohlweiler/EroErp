package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.TipoTelefone;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Telefone da pessoa. Dado pessoal: nunca em log. A lista do salvar substitui a anterior. */
@Entity
@Table(name = "pessoa_telefone")
@Getter
@Setter
@NoArgsConstructor
public class PessoaTelefone extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, updatable = false)
    private Pessoa pessoa;

    /** Posição na lista (0 = primeiro). */
    @Column(name = "ordem", nullable = false)
    private int ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_telefone_id", nullable = false)
    private TipoTelefone tipoTelefone;

    /** Só dígitos, com DDD: 10 (fixo) ou 11 (celular). Sem código do país. */
    @Column(name = "numero", nullable = false, length = 11)
    private String numero;

    @Column(name = "observacao", length = 255)
    private String observacao;

    /** No máximo um por pessoa ({@code uk_pessoa_telefone_principal}). */
    @Column(name = "principal", nullable = false)
    private boolean principal;
}
