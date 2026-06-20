package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RegistroDiarioUtiResponseDto(

        Long       id,
        Long       pessoaId,
        String     pessoaNome,
        LocalDate  data,

        // ── Ficha clínica diária ──────────────────────────────────────────────
        String     dieta,
        String     hgt,
        String     vmO2,
        String     pa,

        // ── Laboratório ───────────────────────────────────────────────────────
        BigDecimal mg,
        BigDecimal k,
        BigDecimal na,
        BigDecimal lact,
        BigDecimal pcr,
        BigDecimal ph,
        BigDecimal pco2,
        BigDecimal hco3,

        // ── Balanço / eliminações ─────────────────────────────────────────────
        BigDecimal bh,
        BigDecimal diurese,
        String     evacuacao,

        // ── TNE prescrito x infundido ─────────────────────────────────────────
        BigDecimal percRecebidoNe,
        BigDecimal volPrescrito24h,
        BigDecimal volRecebido24h,

        @Schema(description = "Percentual recebido computado: volRecebido24h * 100 / volPrescrito24h quando > 0")
        BigDecimal percRecebido,

        // ── Controle de ingestão oral (% por refeição) ────────────────────────
        BigDecimal cafeManha,
        BigDecimal lancheManha,
        BigDecimal almoco,
        BigDecimal lancheTarde,
        BigDecimal jantar,
        BigDecimal ceia,

        String        observacao,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
