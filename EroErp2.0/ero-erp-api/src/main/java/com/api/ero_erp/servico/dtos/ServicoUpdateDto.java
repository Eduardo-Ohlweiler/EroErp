package com.api.ero_erp.servico.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Mesmos campos e mesmas guardas do {@link ServicoCreateDto}. O código não
 * muda, e {@code ativo} tem rota própria.
 *
 * @param filiais o estado completo da lista: a filial que não vier sai
 */
public record ServicoUpdateDto(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome aceita até 150 caracteres")
        String nome,

        @Size(max = 2000, message = "Observação aceita até 2000 caracteres")
        String observacao,

        List<@Valid ServicoFilialItemDto> filiais
) {}
