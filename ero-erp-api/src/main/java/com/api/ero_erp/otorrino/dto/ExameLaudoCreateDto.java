package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ExameLaudoCreateDto(

        @Schema(description = "ID da pessoa examinada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "Data do exame")
        @NotNull(message = "Data do exame é obrigatória")
        LocalDate dataExame,

        @Schema(description = "Tipo do exame/laudo")
        @NotNull(message = "Tipo do exame é obrigatório")
        TipoExameLaudo tipoExame,

        @Schema(description = "Texto descritivo do laudo")
        String laudo,

        @Schema(description = "Conclusão do laudo")
        String conclusao,

        @Schema(description = "CID associado — opcional")
        String cid

) {}
