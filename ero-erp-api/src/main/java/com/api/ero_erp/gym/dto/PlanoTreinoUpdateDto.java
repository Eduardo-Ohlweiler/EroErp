package com.api.ero_erp.gym.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlanoTreinoUpdateDto(

        @Schema(description = "ID da pessoa (aluno/paciente)")
        Long pessoaId,

        @Schema(description = "ID do emitente (personal/responsável) — null remove o emitente")
        Long emitenteId,

        @Schema(description = "Nome do plano de treino")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @Schema(description = "Data de início do plano")
        LocalDate dataInicio,

        @Schema(description = "Data de fim do plano (null remove a data)")
        LocalDate dataFim,

        @Schema(description = "Observações gerais do plano")
        String observacao,

        @Schema(description = "Indica se o plano está ativo")
        Boolean ativo

) {}
