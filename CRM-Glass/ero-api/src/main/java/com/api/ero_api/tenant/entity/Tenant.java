package com.api.ero_api.tenant.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Contratante (cliente da plataforma). É a raiz do multi-tenant, então NÃO é
 * TenantEntity. Só o superadmin cria e altera.
 *
 * <p>O registro com id {@code 00000000-0000-0000-0000-000000000000} é a
 * "Plataforma", dona do superadmin, criada pela migration 001.
 */
@Entity
@Table(name = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class Tenant extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    /** CNPJ ou CPF, só dígitos. */
    @Column(name = "documento", length = 14)
    private String documento;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    /** Obriga todos os usuários a configurar a verificação em duas etapas. */
    @Column(name = "exige_2fa", nullable = false)
    private boolean exige2fa;

    /** Cor de destaque da interface (ver tokens do front). */
    @Column(name = "cor_destaque", nullable = false, length = 20)
    private String corDestaque = "violeta";
}
