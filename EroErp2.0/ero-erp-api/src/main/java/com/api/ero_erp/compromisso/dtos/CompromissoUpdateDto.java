package com.api.ero_erp.compromisso.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Os mesmos campos do {@link CompromissoCreateDto}, sem a recorrência: a
 * série não muda depois de criada, e alterar mexe só nesta ocorrência.
 */
public record CompromissoUpdateDto(
        @NotNull(message = "Filial é obrigatória")
        UUID filialId,

        @NotNull(message = "Responsável é obrigatório")
        UUID responsavelId,

        UUID pessoaId,

        @NotBlank(message = "Título é obrigatório")
        @Size(max = 255, message = "Título aceita até 255 caracteres")
        String titulo,

        @Size(max = 2000, message = "Descrição aceita até 2000 caracteres")
        String descricao,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String cor,

        @NotNull(message = "Início é obrigatório")
        Instant inicio,

        @NotNull(message = "Fim é obrigatório")
        Instant fim,

        @Size(max = 20, message = "No máximo 20 convidados")
        List<@NotNull UUID> convidadoIds
) {}
