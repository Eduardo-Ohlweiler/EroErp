package com.api.ero_erp.otorrino.service;

import com.api.ero_erp.otorrino.enums.CodigoQuestionario;

/**
 * Motor de pontuação (scoring) dos questionários de otorrinolaringologia.
 *
 * <p>É a FONTE DA VERDADE para o cálculo de {@code scoreTotal}, {@code classificacao}
 * e {@code interpretacao} — gravados como snapshot no momento da aplicação.</p>
 *
 * <p>As faixas de NOSE e SNOT-22 são usadas como REFERÊNCIA clínica (não há ponto de
 * corte universalmente padronizado); servem apenas para orientação.</p>
 */
public final class QuestionarioScoring {

    private QuestionarioScoring() {
    }

    /** Resultado consolidado do scoring de um questionário. */
    public record Resultado(int scoreTotal, String classificacao, String interpretacao) {
    }

    /**
     * Calcula o resultado a partir do código do questionário e da soma simples dos valores
     * das respostas (soma dos {@code valor} de cada item respondido).
     */
    public static Resultado calcular(CodigoQuestionario codigo, int somaRespostas) {
        return switch (codigo) {
            case THI     -> scoreThi(somaRespostas);
            case DHI     -> scoreDhi(somaRespostas);
            case EPWORTH -> scoreEpworth(somaRespostas);
            case NOSE    -> scoreNose(somaRespostas);
            case SNOT22  -> scoreSnot22(somaRespostas);
        };
    }

    // ── THI — Tinnitus Handicap Inventory (0–100) ───────────────────────────
    // Graus de Newman: ≤16 Grau 1 · ≤36 Grau 2 · ≤56 Grau 3 · ≤76 Grau 4 · senão Grau 5.
    private static Resultado scoreThi(int total) {
        String classificacao;
        if (total <= 16)      classificacao = "Grau 1 — desprezível";
        else if (total <= 36) classificacao = "Grau 2 — leve";
        else if (total <= 56) classificacao = "Grau 3 — moderado";
        else if (total <= 76) classificacao = "Grau 4 — severo";
        else                  classificacao = "Grau 5 — catastrófico";

        String interpretacao = "Impacto do zumbido na qualidade de vida classificado como "
                + classificacao + " (escore " + total + "/100).";
        return new Resultado(total, classificacao, interpretacao);
    }

    // ── DHI — Dizziness Handicap Inventory (0–100) ──────────────────────────
    // 0–30 leve · 31–60 moderado · 61–100 severo.
    private static Resultado scoreDhi(int total) {
        String classificacao;
        if (total <= 30)      classificacao = "Handicap leve";
        else if (total <= 60) classificacao = "Handicap moderado";
        else                  classificacao = "Handicap severo";

        String interpretacao = "Impacto da tontura/vertigem na qualidade de vida: "
                + classificacao + " (escore " + total + "/100).";
        return new Resultado(total, classificacao, interpretacao);
    }

    // ── EPWORTH — Escala de Sonolência (0–24) ───────────────────────────────
    // 0–9 normal · 10–15 leve a moderada · 16–24 grave. ≥10 indica sonolência excessiva.
    private static Resultado scoreEpworth(int total) {
        String classificacao;
        if (total <= 9)       classificacao = "Normal";
        else if (total <= 15) classificacao = "Sonolência diurna leve a moderada";
        else                  classificacao = "Sonolência diurna grave";

        String interpretacao = total >= 10
                ? "Escore " + total + "/24 — sugere sonolência diurna excessiva; recomenda-se avaliação complementar."
                : "Escore " + total + "/24 — dentro da faixa de normalidade.";
        return new Resultado(total, classificacao, interpretacao);
    }

    // ── NOSE — Nasal Obstruction Symptom Evaluation ─────────────────────────
    // scoreTotal = soma × 5 (0–100). Faixas de REFERÊNCIA.
    private static Resultado scoreNose(int soma) {
        int total = soma * 5;
        String classificacao;
        if (total == 0)       classificacao = "Sem obstrução";
        else if (total <= 25) classificacao = "Obstrução leve";
        else if (total <= 50) classificacao = "Obstrução moderada";
        else if (total <= 75) classificacao = "Obstrução grave";
        else                  classificacao = "Obstrução extrema";

        String interpretacao = "Gravidade da obstrução nasal: " + classificacao
                + " (escore " + total + "/100, faixas de referência).";
        return new Resultado(total, classificacao, interpretacao);
    }

    // ── SNOT-22 (0–110) ─────────────────────────────────────────────────────
    // ≤10 normal · 11–30 leve · 31–50 moderado · >50 grave. Faixas de REFERÊNCIA.
    private static Resultado scoreSnot22(int total) {
        String classificacao;
        if (total <= 10)      classificacao = "Normal";
        else if (total <= 30) classificacao = "Sintomas leves";
        else if (total <= 50) classificacao = "Sintomas moderados";
        else                  classificacao = "Sintomas graves";

        String interpretacao = "Qualidade de vida nasossinusal: " + classificacao
                + " (escore " + total + "/110, faixas de referência).";
        return new Resultado(total, classificacao, interpretacao);
    }
}
