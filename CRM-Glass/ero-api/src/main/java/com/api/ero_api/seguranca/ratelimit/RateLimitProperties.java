package com.api.ero_api.seguranca.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Limites por IP por minuto ({@code app.rate-limit.*}).
 *
 * @param login  tentativas de login
 * @param doisFatores tentativas de código 2FA e pedidos de reenvio (balde único)
 * @param refresh renovações de sessão
 * @param cep    consultas de CEP (cada uma vira uma chamada ao ViaCEP)
 * @param geral  qualquer outra rota da API
 */
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(
        @DefaultValue("10") int login,
        @DefaultValue("10") int doisFatores,
        @DefaultValue("30") int refresh,
        @DefaultValue("30") int cep,
        @DefaultValue("300") int geral) {
}
