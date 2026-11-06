package com.api.ero_api.compartilhado.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

/** Um erro de validação de campo, dentro da propriedade {@code erros} do ProblemDetail. */
@Schema(description = "Erro de validação de um campo")
public record ErroCampoDto(
        @Schema(description = "Nome do campo", example = "email") String campo,
        @Schema(description = "Mensagem para o usuário", example = "E-mail inválido") String mensagem) {
}
