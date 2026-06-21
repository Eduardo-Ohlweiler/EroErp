package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

public record ExameLaudoUpdateDto(

        @Schema(description = "ID da pessoa examinada — opcional na atualização")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "Data do exame")
        LocalDate dataExame,

        @Schema(description = "Tipo do exame/laudo")
        TipoExameLaudo tipoExame,

        @Schema(description = "Texto descritivo do laudo")
        String laudo,

        @Schema(description = "Conclusão do laudo")
        String conclusao,

        @Schema(description = "CID associado — opcional")
        String cid

) {}
