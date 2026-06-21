package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.CurvaJerger;
import com.api.ero_erp.otorrino.enums.ResultadoReflexo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImitanciometriaUpdateDto(

        @Schema(description = "ID da pessoa examinada")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "Data do exame")
        LocalDate dataExame,

        CurvaJerger curvaOd,
        CurvaJerger curvaOe,
        Integer picoPressaoOdDapa,
        Integer picoPressaoOeDapa,
        BigDecimal complacenciaOdMl,
        BigDecimal complacenciaOeMl,
        BigDecimal volumeCanalOdMl,
        BigDecimal volumeCanalOeMl,
        ResultadoReflexo reflexoIpsiOd,
        ResultadoReflexo reflexoContraOd,
        ResultadoReflexo reflexoIpsiOe,
        ResultadoReflexo reflexoContraOe,
        String observacao

) {}
