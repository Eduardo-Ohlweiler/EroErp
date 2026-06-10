package com.api.ero_erp.clinica.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record FichaAnamneseCreateDto(

        @Schema(description = "ID do template de anamnese")
        @NotNull(message = "Template é obrigatório")
        Long templateId,

        @Schema(description = "ID da pessoa (paciente)")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do emitente (opcional)")
        Long emitenteId,

        @Schema(description = "Data de preenchimento da ficha")
        @NotNull(message = "Data de preenchimento é obrigatória")
        LocalDate dataPreenchimento,

        @Schema(description = "Observações gerais da ficha")
        String observacoes,

        @Schema(description = "Lista de respostas aos campos do template")
        @Valid
        List<RespostaAnamneseDto> respostas

) {}
