package com.api.ero_erp.otorrino.dto;

import com.api.ero_erp.otorrino.enums.CurvaJerger;
import com.api.ero_erp.otorrino.enums.ResultadoReflexo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImitanciometriaCreateDto(

        @Schema(description = "ID da pessoa examinada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "Data do exame")
        @NotNull(message = "Data do exame é obrigatória")
        LocalDate dataExame,

        @Schema(description = "Curva timpanométrica (Jerger) OD")
        CurvaJerger curvaOd,

        @Schema(description = "Curva timpanométrica (Jerger) OE")
        CurvaJerger curvaOe,

        @Schema(description = "Pico de pressão OD (daPa)")
        Integer picoPressaoOdDapa,

        @Schema(description = "Pico de pressão OE (daPa)")
        Integer picoPressaoOeDapa,

        @Schema(description = "Complacência de pico OD (ml)")
        BigDecimal complacenciaOdMl,

        @Schema(description = "Complacência de pico OE (ml)")
        BigDecimal complacenciaOeMl,

        @Schema(description = "Volume do conduto auditivo externo OD (ml)")
        BigDecimal volumeCanalOdMl,

        @Schema(description = "Volume do conduto auditivo externo OE (ml)")
        BigDecimal volumeCanalOeMl,

        @Schema(description = "Reflexo estapédico ipsilateral OD")
        ResultadoReflexo reflexoIpsiOd,

        @Schema(description = "Reflexo estapédico contralateral OD")
        ResultadoReflexo reflexoContraOd,

        @Schema(description = "Reflexo estapédico ipsilateral OE")
        ResultadoReflexo reflexoIpsiOe,

        @Schema(description = "Reflexo estapédico contralateral OE")
        ResultadoReflexo reflexoContraOe,

        @Schema(description = "Observação")
        String observacao

) {}
