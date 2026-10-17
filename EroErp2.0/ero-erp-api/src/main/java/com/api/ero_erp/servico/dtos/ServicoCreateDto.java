package com.api.ero_erp.servico.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * O código não vem da tela: é o sistema que o gera.
 *
 * @param filiais o estado completo da lista; vazia ou nula, nenhum valor
 */
public record ServicoCreateDto(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome aceita até 150 caracteres")
        String nome,

        @Size(max = 2000, message = "Observação aceita até 2000 caracteres")
        String observacao,

        List<@Valid ServicoFilialItemDto> filiais
) {}
