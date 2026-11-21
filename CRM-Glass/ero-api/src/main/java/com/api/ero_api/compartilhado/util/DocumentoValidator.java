package com.api.ero_api.compartilhado.util;

import java.util.Locale;

/**
 * CPF (11 dígitos) ou CNPJ (14 posições), com dígito verificador. Também a CNH da pessoa
 * física (11 dígitos, {@link #cnhValida}).
 *
 * <p>Aceita o CNPJ alfanumérico da Receita (IN RFB 2.229/2024, emitido desde
 * julho/2026): as 12 primeiras posições podem ter letras e as 2 últimas são
 * dígitos. No cálculo, cada caractere vale o seu código ASCII − 48 (0–9 → 0–9,
 * A → 17, B → 18...), exatamente como a Receita define.
 *
 * <p>Fica em {@code compartilhado} porque serve a mais de um módulo: o documento do
 * contratante (um ou outro) e o CPF e o CNPJ da pessoa (cada um no seu campo).
 */
public final class DocumentoValidator {

    private static final int[] PESOS_CNPJ_1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] PESOS_CNPJ_2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    private DocumentoValidator() {
    }

    /**
     * Tira máscara e espaços e põe em maiúsculas: "12.abc.345/01de-35" → "12ABC34501DE35".
     * Devolve null se veio vazio e "" se veio texto sem nenhum caractere útil (ex.: "N/A"),
     * para quem chama recusar.
     */
    public static String normalizar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.toUpperCase(Locale.ROOT).replaceAll("[^0-9A-Z]", "");
    }

    /** CPF ou CNPJ. Recebe o valor já normalizado. */
    public static boolean valido(String doc) {
        return cpfValido(doc) || cnpjValido(doc);
    }

    /** 11 dígitos com os dois verificadores certos; recusa sequência repetida (111.111.111-11). Já normalizado. */
    public static boolean cpfValido(String doc) {
        if (doc == null || !doc.matches("\\d{11}") || repetido(doc)) {
            return false;
        }
        return digitoCpf(doc, 9, 10) == doc.charAt(9) - '0' && digitoCpf(doc, 10, 11) == doc.charAt(10) - '0';
    }

    /** 14 posições (12 alfanuméricas + 2 dígitos) com os verificadores certos; recusa sequência repetida. Já normalizado. */
    public static boolean cnpjValido(String doc) {
        if (doc == null || !doc.matches("[0-9A-Z]{12}\\d{2}") || repetido(doc)) {
            return false;
        }
        return digitoCnpj(doc, PESOS_CNPJ_1) == doc.charAt(12) - '0'
                && digitoCnpj(doc, PESOS_CNPJ_2) == doc.charAt(13) - '0';
    }

    /**
     * CNH: 11 dígitos com os dois verificadores do DETRAN (o mesmo cálculo da biblioteca
     * {@code validate-docbr}); recusa sequência repetida. Já normalizada (só dígitos).
     * <ul>
     *   <li>DV1 = soma(d[i] × (9 − i)), i de 0 a 8, mod 11. Se der 10 ou mais, DV1 = 0 e o
     *       desconto do DV2 passa a 2;</li>
     *   <li>DV2 = (soma(d[i] × (i + 1)) mod 11) − desconto. Menor que 0: soma 11. 10 ou mais: 0.</li>
     * </ul>
     */
    public static boolean cnhValida(String cnh) {
        if (cnh == null || !cnh.matches("\\d{11}") || repetido(cnh)) {
            return false;
        }
        int soma1 = 0;
        int soma2 = 0;
        for (int i = 0; i < 9; i++) {
            int d = cnh.charAt(i) - '0';
            soma1 += d * (9 - i);
            soma2 += d * (i + 1);
        }
        int dv1 = soma1 % 11;
        int desconto = 0;
        if (dv1 >= 10) {
            dv1 = 0;
            desconto = 2;
        }
        int dv2 = soma2 % 11 - desconto;
        if (dv2 < 0) {
            dv2 += 11;
        }
        if (dv2 >= 10) {
            dv2 = 0;
        }
        return dv1 == cnh.charAt(9) - '0' && dv2 == cnh.charAt(10) - '0';
    }

    private static boolean repetido(String doc) {
        return doc.chars().distinct().count() == 1;
    }

    private static int digitoCpf(String d, int quantidade, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += (d.charAt(i) - '0') * (pesoInicial - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    private static int digitoCnpj(String d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (d.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
