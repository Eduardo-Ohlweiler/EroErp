package com.api.ero_api.compartilhado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.TenantId;

/**
 * Base de toda entidade que pertence a um contratante.
 *
 * <p>O Hibernate preenche {@code tenant_id} no insert e acrescenta
 * {@code tenant_id = :tenantAtual} em TODA consulta JPQL/Criteria desta entidade
 * (ver {@code TenantIdentifierResolver}). Ninguém filtra tenant à mão.
 *
 * <p>Exceção: SQL nativo não passa pelo filtro. Por isso só existe em classe
 * anotada com {@code @SqlNativoRevisado} (regra do ArquiteturaTest).
 */
@Getter
@MappedSuperclass
public abstract class TenantEntity extends BaseEntity {

    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /**
     * Só para fluxos de plataforma em contexto ROOT (superadmin criando o admin de
     * um contratante novo, seed). Fora do ROOT o Hibernate recusa o insert se o
     * valor for diferente do tenant atual — não tente usar para "trocar" tenant.
     */
    public void atribuirTenant(UUID tenantId) {
        this.tenantId = tenantId;
    }
}
