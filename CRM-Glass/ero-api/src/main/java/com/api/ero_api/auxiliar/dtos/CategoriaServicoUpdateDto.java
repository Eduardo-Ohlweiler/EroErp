package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Edição (PUT) de uma categoria de serviço. {@code version} é a versão que o usuário viu;
 * se alguém salvou antes, dá 409.
 */
@Schema(description = "Dados para alterar uma categoria de serviço")
public record CategoriaServicoUpdateDto(

        @Schema(description = "Nome (único no contratante, sem diferenciar maiúsculas nem acento)", example = "Instalação")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 40, message = "Nome deve ter no máximo 40 caracteres")
        String nome,

        @Schema(description = "Versão do registro que está sendo editado", example = "0")
        @NotNull(message = "Versão é obrigatória")
        Long version) {
}
