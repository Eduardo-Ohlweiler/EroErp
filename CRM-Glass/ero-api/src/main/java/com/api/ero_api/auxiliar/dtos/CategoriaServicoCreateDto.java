package com.api.ero_api.auxiliar.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cadastro de uma categoria de serviço. O código é gerado no salvar. */
@Schema(description = "Dados para cadastrar uma categoria de serviço")
public record CategoriaServicoCreateDto(

        @Schema(description = "Nome (único no contratante, sem diferenciar maiúsculas nem acento)", example = "Instalação")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 40, message = "Nome deve ter no máximo 40 caracteres")
        String nome) {
}
