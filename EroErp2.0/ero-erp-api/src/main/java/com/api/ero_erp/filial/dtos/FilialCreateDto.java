package com.api.ero_erp.filial.dtos;

import com.api.ero_erp.filial.enums.TipoFilial;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

/**
 * @param matrizId obrigatório na {@code FILIAL}, proibido na {@code MATRIZ}
 *                 — quem confere é o service, que sabe o tipo
 */
public record FilialCreateDto(
        @NotNull(message = "Pessoa é obrigatória")
        UUID pessoaId,

        @NotNull(message = "Tipo é obrigatório")
        TipoFilial tipo,

        UUID matrizId,

        @NotBlank(message = "Cor é obrigatória")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String cor
) {}
