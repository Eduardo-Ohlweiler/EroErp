package com.api.ero_erp.terapianutricional.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoNutricionalUtiCreateDto(

        @Schema(description = "ID da pessoa (paciente) avaliada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do profissional responsável — opcional")
        Long usuarioId,

        @Schema(description = "Data da avaliação")
        @NotNull(message = "Data da avaliação é obrigatória")
        LocalDate dataAvaliacao,

        // ── Entradas antropometria ───────────────────────────────────────────
        @Schema(description = "Sexo: M ou F")
        String sexo,

        @Schema(description = "Raça/etnia")
        String raca,

        @Schema(description = "Idade em anos")
        Integer idade,

        @Schema(description = "Circunferência do braço (cm)")
        BigDecimal cb,

        @Schema(description = "Circunferência da panturrilha (cm)")
        BigDecimal cp,

        @Schema(description = "Circunferência abdominal (cm)")
        BigDecimal ca,

        @Schema(description = "Altura do joelho (cm)")
        BigDecimal aj,

        @Schema(description = "Peso atual (kg)")
        BigDecimal pesoAtual,

        @Schema(description = "Peso usual (kg)")
        BigDecimal pesoUsual,

        @Schema(description = "Altura (cm)")
        BigDecimal altura,

        // ── Resultados antropometria (snapshot) ──────────────────────────────
        BigDecimal alturaEstimada,
        BigDecimal pesoEstimadoChumlea,
        BigDecimal pesoEstimadoJung,
        BigDecimal pesoEstimadoRabito,
        BigDecimal imc,
        BigDecimal pesoIdeal,
        BigDecimal pesoIdealImc25,
        BigDecimal pesoAjustado,
        BigDecimal percPerdaPeso,
        BigDecimal percAdequacaoCb,
        String     classifImcOms,
        String     classifImcOpas,
        String     classifPerdaPeso,
        String     classifAdequacaoCb,
        String     classifDeplecaoCp,

        // ── Necessidades (snapshot) ───────────────────────────────────────────
        String     fase,
        BigDecimal kcalKgAlvo,
        BigDecimal ptnKgAlvo,
        BigDecimal kcalMin,
        BigDecimal kcalMax,
        BigDecimal ptnMin,
        BigDecimal ptnMax,
        BigDecimal kcalTotal,
        BigDecimal ptnTotal,
        BigDecimal ptnHdIntermitente,
        BigDecimal ptnHdContinua,

        // ── Dieta enteral (snapshot) ──────────────────────────────────────────
        @Schema(description = "ID da fórmula enteral utilizada — opcional (pode ser global)")
        Long       formulaEnteralId,
        String     formulaNome,
        BigDecimal formulaDensidadeKcalMl,
        BigDecimal formulaProteinaGL,
        String     modoDieta,
        BigDecimal volumeDieta,
        BigDecimal tempoDieta,
        BigDecimal dietaVt,
        BigDecimal dietaKcal,
        BigDecimal dietaPtn,
        BigDecimal dietaKcalKg,
        BigDecimal dietaPtnKg,
        BigDecimal dietaPercVct,
        BigDecimal dietaPercPtn,
        BigDecimal dietaVolumePleno,

        // ── Hidratação (snapshot) ─────────────────────────────────────────────
        BigDecimal hidratacaoVolumeDieta,
        BigDecimal hidratacaoNecMin,
        BigDecimal hidratacaoNecIdeal,
        BigDecimal hidratacaoAguaDieta,
        BigDecimal hidratacaoAguaExtraMin,
        BigDecimal hidratacaoAguaExtraIdeal,

        @Schema(description = "Observação")
        String observacao

) {}
