package com.api.ero_api.seguranca.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Limites por IP por minuto ({@code app.rate-limit.*}).
 *
 * @param login  tentativas de login
 * @param doisFatores tentativas de código 2FA
 * @param refresh renovações de sessão
 * @param geral  qualquer outra rota da API
 */
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(
        @DefaultValue("10") int login,
        @DefaultValue("10") int doisFatores,
        @DefaultValue("30") int refresh,
        @DefaultValue("300") int geral) {
}
