package com.api.ero_api.pessoa.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Pessoa para combo (vínculos, cadastros que apontam para uma pessoa). Leva o código
 * para o combo mostrar "código · nome". Nada além disso: a seleção não expõe documento
 * nem contato.
 */
@Schema(description = "Pessoa para seleção")
public record PessoaSelectDto(
        UUID id,
        @Schema(example = "42") Long codPessoa,
        @Schema(example = "Marina Souza") String nome) {
}
