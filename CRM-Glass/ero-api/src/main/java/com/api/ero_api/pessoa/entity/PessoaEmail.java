package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.TipoEmail;
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

/** E-mail da pessoa. Dado pessoal: nunca em log. A lista do salvar substitui a anterior. */
@Entity
@Table(name = "pessoa_email")
@Getter
@Setter
@NoArgsConstructor
public class PessoaEmail extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, updatable = false)
    private Pessoa pessoa;

    /** Posição na lista (0 = primeiro). */
    @Column(name = "ordem", nullable = false)
    private int ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_email_id", nullable = false)
    private TipoEmail tipoEmail;

    /** Sempre minúsculo ({@code ck_pessoa_email_minusculo}). */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "observacao", length = 255)
    private String observacao;

    /** No máximo um por pessoa ({@code uk_pessoa_email_principal}). */
    @Column(name = "principal", nullable = false)
    private boolean principal;
}
