package com.api.ero_api.auditoria.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Um tipo de evento da trilha, para o filtro e as colunas da tela Logs. O front agrupa
 * por {@code categoria} e manda os {@code codigo} da categoria escolhida em {@code tipos}.
 */
@Schema(description = "Tipo de evento de segurança")
public record TipoEventoDto(
        @Schema(description = "Código do tipo (o mesmo de EventoSegurancaResponseDto.tipo)", example = "LOGIN_FALHA") String codigo,
        @Schema(description = "Nome do evento para a tela", example = "Falha no login") String rotulo,
        @Schema(description = "Código da categoria", example = "FALHAS") String categoria,
        @Schema(description = "Nome da categoria para a tela", example = "Falhas e bloqueios") String categoriaRotulo,
        @Schema(description = "É uma falha (o front destaca)") boolean falha) {
}
