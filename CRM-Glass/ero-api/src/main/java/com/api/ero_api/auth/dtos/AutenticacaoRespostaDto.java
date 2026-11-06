package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Resposta do login/refresh. Se {@code requerDoisFatores}, só vem o
 * {@code desafioDoisFatores}: o front pede o código e chama /api/auth/2fa/verificar.
 * O refresh token NUNCA vem no corpo: vai no cookie httpOnly.
 */
@Schema(description = "Resultado da autenticação")
public record AutenticacaoRespostaDto(
        boolean requerDoisFatores,
        @Schema(description = "Vale 5 minutos, só para a etapa do código") String desafioDoisFatores,
        @Schema(description = "Guardar só em memória; enviar em Authorization: Bearer") String tokenAcesso,
        Instant tokenExpiraEm,
        UsuarioLogadoDto usuario) {

    @Override
    public String toString() {
        return "AutenticacaoRespostaDto[requerDoisFatores=" + requerDoisFatores + ", ***]";
    }

    public static AutenticacaoRespostaDto desafio(String desafio) {
        return new AutenticacaoRespostaDto(true, desafio, null, null, null);
    }

    public static AutenticacaoRespostaDto sessao(String token, Instant expira, UsuarioLogadoDto usuario) {
        return new AutenticacaoRespostaDto(false, null, token, expira, usuario);
    }
}
