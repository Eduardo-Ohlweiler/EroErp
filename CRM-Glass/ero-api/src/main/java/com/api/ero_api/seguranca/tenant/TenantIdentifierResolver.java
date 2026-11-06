package com.api.ero_api.seguranca.tenant;

import com.api.ero_api.seguranca.SecurityUtils;
import java.util.Map;
import java.util.UUID;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

/**
 * Diz ao Hibernate qual é o tenant de cada sessão. É isso que faz o
 * {@code @TenantId} da {@code TenantEntity} filtrar e preencher sozinho.
 *
 * <p>Ordem: tenant forçado pelo {@link TenantContext} → tenant do token do usuário
 * logado → {@link TenantContext#NENHUM} (não enxerga nada).
 */
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID>, HibernatePropertiesCustomizer {

    @Override
    public UUID resolveCurrentTenantIdentifier() {
        UUID forcado = TenantContext.forcado();
        if (forcado != null) {
            return forcado;
        }
        return SecurityUtils.usuarioLogado()
                .map(u -> u.tenantId())
                .orElse(TenantContext.NENHUM);
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return false;
    }

    @Override
    public boolean isRoot(UUID tenantId) {
        return TenantContext.ROOT.equals(tenantId);
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this);
    }
}
