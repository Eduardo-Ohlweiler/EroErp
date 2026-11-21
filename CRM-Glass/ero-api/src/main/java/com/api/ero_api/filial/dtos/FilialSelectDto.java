package com.api.ero_api.filial.dtos;

import com.api.ero_api.filial.enums.TipoFilial;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Filial para combo (e a matriz dentro do {@link FilialResponseDto}). O {@code /selecao} é
 * aberto a quem está logado: por isso não leva CPF nem CNPJ.
 */
@Schema(description = "Filial para seleção")
public record FilialSelectDto(
        UUID id,
        @Schema(example = "1") Long codFilial,
        @Schema(description = "Nome da pessoa da filial") String nome,
        TipoFilial tipo,
        @Schema(description = "#RRGGBB", example = "#3B82F6") String cor) {
}
