package com.api.ero_erp.gym.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlanoTreinoCreateDto(

        @Schema(description = "ID da pessoa (aluno/paciente)")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do usuário (personal/responsável) — opcional")
        Long usuarioId,

        @Schema(description = "Nome do plano de treino", example = "Treino A — Hipertrofia")
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
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
