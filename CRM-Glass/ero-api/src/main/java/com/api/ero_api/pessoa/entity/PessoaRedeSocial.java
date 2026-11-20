package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.TipoRedeSocial;
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

/** Rede social da pessoa: usuário, link ou os dois. A lista do salvar substitui a anterior. */
@Entity
@Table(name = "pessoa_rede_social")
@Getter
@Setter
@NoArgsConstructor
public class PessoaRedeSocial extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, updatable = false)
    private Pessoa pessoa;

    /** Posição na lista (0 = primeiro). */
    @Column(name = "ordem", nullable = false)
    private int ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_rede_social_id", nullable = false)
    private TipoRedeSocial tipoRedeSocial;

    @Column(name = "usuario", length = 255)
    private String usuario;

    /** Só {@code http://} ou {@code https://} ({@code ck_pessoa_rede_social_url}). */
    @Column(name = "url", length = 500)
    private String url;
}
