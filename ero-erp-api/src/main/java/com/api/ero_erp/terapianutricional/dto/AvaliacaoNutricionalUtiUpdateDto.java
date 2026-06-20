package com.api.ero_erp.terapianutricional.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoNutricionalUtiUpdateDto(

        Long      pessoaId,
        Long      usuarioId,
        LocalDate dataAvaliacao,

        // ── Entradas antropometria ───────────────────────────────────────────
        String     sexo,
        String     raca,
        Integer    idade,
        BigDecimal cb,
        BigDecimal cp,
        BigDecimal ca,
        BigDecimal aj,
        BigDecimal pesoAtual,
        BigDecimal pesoUsual,
        BigDecimal altura,

        // ── Resultados antropometria ──────────────────────────────────────────
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

        // ── Necessidades ──────────────────────────────────────────────────────
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

        // ── Dieta enteral ─────────────────────────────────────────────────────
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

        // ── Hidratação ────────────────────────────────────────────────────────
        BigDecimal hidratacaoVolumeDieta,
        BigDecimal hidratacaoNecMin,
        BigDecimal hidratacaoNecIdeal,
        BigDecimal hidratacaoAguaDieta,
        BigDecimal hidratacaoAguaExtraMin,
        BigDecimal hidratacaoAguaExtraIdeal,

        String observacao

) {}
