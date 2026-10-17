package com.api.ero_erp.auxiliarproduto.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Grupo, categoria e marca — criar e alterar levam o mesmo campo. {@code ativo}
 * tem rota própria.
 */
public record AuxiliarRequestDto(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome aceita até 100 caracteres")
        String nome
) {}
