package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Edição (PUT) de um tipo de telefone do contratante. Item do sistema não se edita (422).
 * {@code version} é a versão que o usuário viu; se alguém salvou antes, dá 409.
 */
@Schema(description = "Dados para alterar um tipo de telefone")
public record TipoTelefoneUpdateDto(

        @Schema(description = "Nome (único no contratante, sem diferenciar maiúsculas nem acento)", example = "Recado")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 25, message = "Nome deve ter no máximo 25 caracteres")
        String nome,

        @Schema(description = "Versão do registro que está sendo editado", example = "0")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
