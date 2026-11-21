package com.api.ero_api.localidade.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/** Cidade para combo e para o endereço (id, nome e a sigla da UF). */
@Schema(description = "Cidade para seleção")
public record CidadeSelectDto(
        UUID id,
        @Schema(example = "São Paulo") String nome,
        @Schema(description = "Sigla da UF", example = "SP") String uf) {
}
