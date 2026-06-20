package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RegistroDiarioUtiUpdateDto(

        @Schema(description = "ID da pessoa (paciente) do registro")
        Long pessoaId,

        @Schema(description = "Data do registro diário")
        LocalDate data,

        // ── Ficha clínica diária ──────────────────────────────────────────────
        @Schema(description = "Dieta do dia") String dieta,
        @Schema(description = "HGT (glicemia capilar)") String hgt,
        @Schema(description = "Ventilação mecânica / O2 / ar ambiente") String vmO2,
        @Schema(description = "Pressão arterial") String pa,

        // ── Laboratório ───────────────────────────────────────────────────────
        @Schema(description = "Magnésio") BigDecimal mg,
        @Schema(description = "Potássio") BigDecimal k,
        @Schema(description = "Sódio") BigDecimal na,
        @Schema(description = "Lactato") BigDecimal lact,
        @Schema(description = "PCR") BigDecimal pcr,
        @Schema(description = "pH") BigDecimal ph,
        @Schema(description = "pCO2") BigDecimal pco2,
        @Schema(description = "HCO3") BigDecimal hco3,

        // ── Balanço / eliminações ─────────────────────────────────────────────
        @Schema(description = "Balanço hídrico") BigDecimal bh,
        @Schema(description = "Diurese") BigDecimal diurese,
        @Schema(description = "Evacuação") String evacuacao,

        // ── TNE prescrito x infundido ─────────────────────────────────────────
        @Schema(description = "Percentual recebido de nutrição enteral") BigDecimal percRecebidoNe,
        @Schema(description = "Volume prescrito em 24h") BigDecimal volPrescrito24h,
        @Schema(description = "Volume recebido em 24h") BigDecimal volRecebido24h,

        // ── Controle de ingestão oral (% por refeição) ────────────────────────
        @Schema(description = "% café da manhã") BigDecimal cafeManha,
        @Schema(description = "% lanche da manhã") BigDecimal lancheManha,
        @Schema(description = "% almoço") BigDecimal almoco,
        @Schema(description = "% lanche da tarde") BigDecimal lancheTarde,
        @Schema(description = "% jantar") BigDecimal jantar,
        @Schema(description = "% ceia") BigDecimal ceia,

        @Schema(description = "Observações")
        String observacao
) {}
