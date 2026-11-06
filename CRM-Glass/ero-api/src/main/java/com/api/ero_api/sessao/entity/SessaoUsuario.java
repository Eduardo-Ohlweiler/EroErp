package com.api.ero_api.sessao.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import com.api.ero_api.sessao.enums.MotivoRevogacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Uma sessão = um login num navegador. Os refresh tokens giram dentro dela;
 * revogar a sessão derruba todos de uma vez.
 *
 * <p>NÃO é TenantEntity de propósito: o refresh chega sem token de acesso, então
 * a busca precisa acontecer antes de saber o tenant (contexto ROOT, pelo hash).
 */
@Entity
@Table(name = "sessao_usuario")
@Getter
@Setter
@NoArgsConstructor
public class SessaoUsuario extends BaseEntity {

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    /** Tenant do usuário (dono da sessão). */
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /** Só para superadmin: contratante que ele está acessando agora. */
    @Column(name = "tenant_atuacao_id")
    private UUID tenantAtuacaoId;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(name = "ultimo_uso_em", nullable = false)
    private Instant ultimoUsoEm;

    @Column(name = "revogada_em")
    private Instant revogadaEm;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_revogacao", length = 40)
    private MotivoRevogacao motivoRevogacao;

    public boolean ativaEm(Instant momento) {
        return revogadaEm == null && expiraEm.isAfter(momento);
    }

    /** Tenant que vai no token: o de atuação (superadmin) ou o do próprio usuário. */
    public UUID tenantEfetivo() {
        return tenantAtuacaoId != null ? tenantAtuacaoId : tenantId;
    }

    public void revogar(MotivoRevogacao motivo, Instant momento) {
        if (revogadaEm == null) {
            revogadaEm = momento;
            motivoRevogacao = motivo;
        }
    }
}
