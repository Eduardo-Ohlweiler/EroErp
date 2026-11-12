package com.api.ero_api.auth.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * Resposta do login/refresh.
 *
 * <p>Login com senha certa: {@code requerDoisFatores = true} e vêm só o desafio e
 * os dados do código enviado por e-mail; o front pede o código e chama
 * /api/auth/2fa/verificar. Verificação, refresh e troca de contratante: vêm o
 * token de acesso e o usuário. O refresh token NUNCA vem no corpo: vai no cookie httpOnly.
 */
@Schema(description = "Resultado da autenticação")
public record AutenticacaoRespostaDto(
        boolean requerDoisFatores,
        @Schema(description = "Vale 10 minutos desde o 1º envio do código, só para a etapa do código") String desafioDoisFatores,
        @Schema(description = "Para onde o código foi enviado, mascarado", example = "m*****@e*****.com.br") String emailMascarado,
        @Schema(description = "Quando o código (e o desafio) deixa de valer") Instant codigoExpiraEm,
        @Schema(description = "A partir de quando dá para pedir o reenvio do código") Instant reenvioDisponivelEm,
        @Schema(description = "Guardar só em memória; enviar em Authorization: Bearer") String tokenAcesso,
        Instant tokenExpiraEm,
        UsuarioLogadoDto usuario) {

    @Override
    public String toString() {
        return "AutenticacaoRespostaDto[requerDoisFatores=" + requerDoisFatores + ", ***]";
    }

    public static AutenticacaoRespostaDto desafio(String desafio, CodigoEnviadoDto codigo) {
        return new AutenticacaoRespostaDto(true, desafio, codigo.emailMascarado(), codigo.codigoExpiraEm(),
                codigo.reenvioDisponivelEm(), null, null, null);
    }

    public static AutenticacaoRespostaDto sessao(String token, Instant expira, UsuarioLogadoDto usuario) {
        return new AutenticacaoRespostaDto(false, null, null, null, null, token, expira, usuario);
    }
}
