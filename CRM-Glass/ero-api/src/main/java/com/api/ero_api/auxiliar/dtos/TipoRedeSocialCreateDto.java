package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cadastro de um tipo de rede social do contratante. O código é gerado no salvar. */
@Schema(description = "Dados para cadastrar um tipo de rede social")
public record TipoRedeSocialCreateDto(

        @Schema(description = "Nome (único no contratante, sem diferenciar maiúsculas nem acento)", example = "YouTube")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 25, message = "Nome deve ter no máximo 25 caracteres")
        String nome) {
}
