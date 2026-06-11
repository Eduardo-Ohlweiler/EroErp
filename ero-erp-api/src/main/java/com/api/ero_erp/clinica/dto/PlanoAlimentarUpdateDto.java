package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlanoAlimentarUpdateDto(

        @Schema(description = "ID da pessoa (paciente)")
        Long pessoaId,

        @Schema(description = "ID do emitente (nutricionista/responsável)")
        Long emitenteId,

        @Schema(description = "Nome do plano alimentar")
        @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
        String nome,

        @Schema(description = "Data de início do plano")
        LocalDate dataInicio,

        @Schema(description = "Data de fim do plano")
        LocalDate dataFim,

        @Schema(description = "Observações gerais do plano")
        String observacao,

        @Schema(description = "Indica se o plano está ativo")
        Boolean ativo

) {}
