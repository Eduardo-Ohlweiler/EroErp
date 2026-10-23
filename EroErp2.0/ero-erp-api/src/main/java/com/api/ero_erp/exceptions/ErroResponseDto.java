package com.api.ero_erp.exceptions;

import java.time.Instant;

/**
 * @param codigo o status HTTP
 * @param motivo marca estável para o front distinguir um erro sem ler a
 *               frase — só em erros que pedem tratamento próprio; nos demais
 *               é nula e sai ausente do JSON ({@code non_null}). Hoje:
 *               {@code SESSAO_RENOVADA_EM_OUTRA_ABA} no {@code /auth/refresh}.
 */
public record ErroResponseDto(
        String erro,
        int codigo,
        Instant timestamp,
        String path,
        String motivo
) {
    public static ErroResponseDto de(String erro, int codigo, String path) {
        return de(erro, codigo, path, null);
    }

    public static ErroResponseDto de(String erro, int codigo, String path, String motivo) {
        return new ErroResponseDto(erro, codigo, Instant.now(), path, motivo);
    }
}
