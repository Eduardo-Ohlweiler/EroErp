package com.api.ero_erp.otorrino.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AudiometriaUpdateDto(

        @Schema(description = "ID da pessoa examinada")
        Long pessoaId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "ID do profissional responsável — opcional")
        Long usuarioId,

        @Schema(description = "Data do exame")
        LocalDate dataExame,

        Integer srtOdDb,
        Integer srtOeDb,
        BigDecimal irfOdPerc,
        BigDecimal irfOePerc,
        String norma,
        String observacao,

        @Schema(description = "Pontos plotados no audiograma — quando informado, substitui a coleção atual")
        @Valid
        List<AudiometriaLimiarDto> limiares

) {}
