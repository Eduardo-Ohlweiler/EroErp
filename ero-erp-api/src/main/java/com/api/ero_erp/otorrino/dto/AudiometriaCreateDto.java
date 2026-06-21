package com.api.ero_erp.otorrino.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AudiometriaCreateDto(

        @Schema(description = "ID da pessoa examinada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "ID do profissional responsável — opcional")
        Long usuarioId,

        @Schema(description = "Data do exame")
        @NotNull(message = "Data do exame é obrigatória")
        LocalDate dataExame,

        @Schema(description = "SRT (limiar de reconhecimento de fala) OD em dB")
        Integer srtOdDb,

        @Schema(description = "SRT (limiar de reconhecimento de fala) OE em dB")
        Integer srtOeDb,

        @Schema(description = "IRF (índice de reconhecimento de fala) OD em %")
        BigDecimal irfOdPerc,

        @Schema(description = "IRF (índice de reconhecimento de fala) OE em %")
        BigDecimal irfOePerc,

        @Schema(description = "Norma de classificação: OMS | BIAP — default OMS")
        String norma,

        @Schema(description = "Observação")
        String observacao,

        @Schema(description = "Pontos plotados no audiograma")
        @Valid
        List<AudiometriaLimiarDto> limiares

) {}
