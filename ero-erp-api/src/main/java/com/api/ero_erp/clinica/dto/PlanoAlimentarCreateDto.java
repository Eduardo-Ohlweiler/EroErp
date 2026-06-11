package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlanoAlimentarCreateDto(

        @Schema(description = "ID da pessoa (paciente)")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do emitente (nutricionista/responsável) — opcional")
        Long emitenteId,

        @Schema(description = "Nome do plano alimentar", example = "Plano Low Carb — Fase 1")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Data de início do plano")
        @NotNull(message = "Data de início é obrigatória")
        LocalDate dataInicio,

        @Schema(description = "Data de fim do plano (opcional)")
        LocalDate dataFim,

        @Schema(description = "Observações gerais do plano")
        String observacao,

        @Schema(description = "Indica se o plano está ativo")
        Boolean ativo

) {}
