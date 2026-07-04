package com.api.ero_erp.crm.dashboard.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Utilitário de geolocalização por número de WhatsApp (DDI+DDD+número, digits-only).
 * Mapeia DDD brasileiro (após o DDI "55") para UF, e UF para região.
 */
public final class GeoBrasilUtils {

    private GeoBrasilUtils() {}

    private static final Map<String, String> DDD_UF    = new HashMap<>();
    private static final Map<String, String> UF_REGIAO = new HashMap<>();

    static {
        // ── Sudeste ──────────────────────────────────────────────────────────
        put("SP", "11", "12", "13", "14", "15", "16", "17", "18", "19");
        put("RJ", "21", "22", "24");
        put("ES", "27", "28");
        put("MG", "31", "32", "33", "34", "35", "37", "38");
        // ── Sul ──────────────────────────────────────────────────────────────
        put("PR", "41", "42", "43", "44", "45", "46");
        put("SC", "47", "48", "49");
        put("RS", "51", "53", "54", "55");
        // ── Centro-Oeste ─────────────────────────────────────────────────────
        put("DF", "61");
        put("GO", "62", "64");
        put("MT", "65", "66");
        put("MS", "67");
        // ── Norte ────────────────────────────────────────────────────────────
        put("TO", "63");
        put("AC", "68");
        put("RO", "69");
        put("PA", "91", "93", "94");
        put("AM", "92", "97");
        put("RR", "95");
        put("AP", "96");
        // ── Nordeste ─────────────────────────────────────────────────────────
        put("BA", "71", "73", "74", "75", "77");
        put("SE", "79");
        put("PE", "81", "87");
        put("AL", "82");
        put("PB", "83");
        put("RN", "84");
        put("CE", "85", "88");
        put("PI", "86", "89");
        put("MA", "98", "99");

        reg("Norte",        "AC", "AP", "AM", "PA", "RO", "RR", "TO");
        reg("Nordeste",     "AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE");
        reg("Centro-Oeste", "DF", "GO", "MT", "MS");
        reg("Sudeste",      "ES", "MG", "RJ", "SP");
        reg("Sul",          "PR", "RS", "SC");
    }

    private static void put(String uf, String... ddds) {
        for (String ddd : ddds) DDD_UF.put(ddd, uf);
    }

    private static void reg(String regiao, String... ufs) {
        for (String uf : ufs) UF_REGIAO.put(uf, regiao);
    }

    /**
     * Deriva a UF a partir do número WhatsApp (digits-only, ex. "5551992006747").
     * Considera apenas números brasileiros (DDI "55"): pega os 2 dígitos seguintes
     * como DDD. Retorna {@code null} se não for brasileiro, curto demais ou DDD inválido.
     */
    public static String dddParaUf(String numero) {
        if (numero == null) return null;
        if (!numero.startsWith("55")) return null;
        if (numero.length() < 4) return null;
        String ddd = numero.substring(2, 4);
        return DDD_UF.get(ddd);
    }

    /**
     * Mapeia a sigla de UF para a região do Brasil (Norte/Nordeste/Sudeste/Sul/Centro-Oeste).
     * Retorna {@code null} para UF nula ou desconhecida.
     */
    public static String ufParaRegiao(String uf) {
        if (uf == null) return null;
        return UF_REGIAO.get(uf.toUpperCase());
    }
}
