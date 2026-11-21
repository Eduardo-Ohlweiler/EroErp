package com.api.ero_api.localidade.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

/**
 * Unidade da federação, do IBGE (semente da migration 013).
 *
 * <p>NÃO é TenantEntity de propósito: é dado de referência, igual para todos os
 * contratantes, e nenhum deles tem a própria lista de estados. Ninguém grava pela
 * API; a aplicação só lê. Está na lista justificada {@code ENTIDADES_SEM_TENANT} do
 * ArquiteturaTest.
 */
@Entity
@Table(name = "estado")
@Immutable
@Getter
@Setter
@NoArgsConstructor
public class Estado extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    /** "SP", "RS"... */
    @Column(name = "sigla", nullable = false, length = 2)
    private String sigla;

    @Column(name = "codigo_ibge", nullable = false)
    private Integer codigoIbge;
}
