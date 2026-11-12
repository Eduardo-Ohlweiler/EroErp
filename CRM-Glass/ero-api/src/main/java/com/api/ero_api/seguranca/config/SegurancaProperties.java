package com.api.ero_api.seguranca.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Tudo que é configurável na segurança ({@code app.seguranca.*} no YAML).
 * Segredos vêm SEMPRE de variável de ambiente; a aplicação não sobe sem eles.
 *
 * @param jwtSegredo        chave HMAC do JWT, base64, mínimo 32 bytes (APP_JWT_SEGREDO)
 * @param criptoChave       chave AES-256 dos campos cifrados, base64, 32 bytes (APP_CRIPTO_CHAVE)
 * @param tokenAcesso       vida do token de acesso
 * @param sessao            vida máxima da sessão (refresh) sem novo login
 * @param desafio2fa        validade do código enviado por e-mail (e do desafio), contada do 1º envio
 * @param cookieSeguro      cookie de refresh só em HTTPS (desligar só em dev)
 * @param csp               Content-Security-Policy devolvida pela API
 * @param corsOrigens       origens do front que podem chamar a API
 * @param loginMaxTentativas erros de senha ou de código seguidos antes de bloquear a conta
 * @param loginBloqueio     quanto tempo a conta fica bloqueada
 * @param refreshTolerancia reuso de refresh dentro deste tempo é tratado como
 *                          corrida entre abas (recusa sem derrubar a sessão)
 * @param codigoReenvioIntervalo tempo mínimo entre dois envios do mesmo código
 * @param codigoMaxEnvios   envios do mesmo código (o 1º + reenvios) antes de exigir login de novo
 */
@Validated
@ConfigurationProperties("app.seguranca")
public record SegurancaProperties(
        @NotBlank String jwtSegredo,
        @NotBlank String criptoChave,
        @DefaultValue("15m") Duration tokenAcesso,
        @DefaultValue("7d") Duration sessao,
        @DefaultValue("10m") Duration desafio2fa,
        @DefaultValue("true") boolean cookieSeguro,
        @DefaultValue("default-src 'none'; frame-ancestors 'none'") String csp,
        @DefaultValue List<String> corsOrigens,
        @DefaultValue("5") @Min(1) int loginMaxTentativas,
        @DefaultValue("15m") Duration loginBloqueio,
        @DefaultValue("10s") Duration refreshTolerancia,
        @DefaultValue("60s") Duration codigoReenvioIntervalo,
        @DefaultValue("5") @Min(1) int codigoMaxEnvios) {
}
