package com.api.ero_erp.auxiliarproduto.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * O grupo pode mudar na alteração: os produtos do subgrupo vão junto, porque
 * apontam para o subgrupo, não para o grupo.
 */
public record SubgrupoRequestDto(
        @NotNull(message = "Grupo é obrigatório")
        UUID grupoId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome aceita até 100 caracteres")
        String nome
) {}
