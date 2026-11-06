package com.api.ero_api.seguranca.tenant;

import java.util.UUID;
import java.util.function.Supplier;

/**
 * Troca explícita do tenant da thread atual, para os poucos fluxos que acontecem
 * ANTES de existir um usuário autenticado (login, refresh, seed) ou que precisam
 * agir em nome de outro tenant (superadmin criando contratante).
 *
 * <p>Regras:
 * <ul>
 *   <li>Chame SEMPRE por fora da transação: o Hibernate lê o tenant quando abre a
 *       sessão. Use {@code TransactionTemplate} dentro do supplier.</li>
 *   <li>{@link #ROOT} enxerga todos os tenants. Use só em código de autenticação
 *       e plataforma, e documente o porquê.</li>
 *   <li>Fora disso, o tenant vem do token (ver {@link TenantIdentifierResolver}).</li>
 * </ul>
 */
public final class TenantContext {

    /** Tenant "Plataforma": dono do superadmin. Enxerga todos (isRoot). */
    public static final UUID ROOT = new UUID(0L, 0L);

    /** Usado quando não há ninguém autenticado: não casa com nenhuma linha (falha fechada). */
    public static final UUID NENHUM = new UUID(-1L, -1L);

    private static final ThreadLocal<UUID> FORCADO = new ThreadLocal<>();

    private TenantContext() {
    }

    public static <T> T comoRoot(Supplier<T> acao) {
        return comoTenant(ROOT, acao);
    }

    public static <T> T comoTenant(UUID tenantId, Supplier<T> acao) {
        UUID anterior = FORCADO.get();
        FORCADO.set(tenantId);
        try {
            return acao.get();
        } finally {
            if (anterior == null) {
                FORCADO.remove();
            } else {
                FORCADO.set(anterior);
            }
        }
    }

    static UUID forcado() {
        return FORCADO.get();
    }
}
