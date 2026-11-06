package com.api.ero_api.auditoria.entity;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.compartilhado.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Trilha de segurança. NÃO é TenantEntity de propósito: login com e-mail
 * inexistente não tem tenant. Por isso a consulta filtra {@code tenantId} à mão
 * (ver EventoSegurancaService.listar). Só insere, nunca altera.
 */
@Entity
@Table(name = "evento_seguranca")
@Getter
@Setter
@NoArgsConstructor
public class EventoSeguranca extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 40)
    private TipoEventoSeguranca tipo;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    /** Texto curto, já mascarado. Nunca senha, token ou documento inteiro. */
    @Column(name = "detalhe", length = 500)
    private String detalhe;
}
