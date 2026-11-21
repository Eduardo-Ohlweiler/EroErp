package com.api.ero_api.localidade.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** Unidade da federação para combo (a UF do RG): id, sigla e nome. */
@Schema(description = "Estado (UF) para seleção")
public record EstadoSelectDto(
        UUID id,
        @Schema(example = "SP") String sigla,
        @Schema(example = "São Paulo") String nome) {
}
