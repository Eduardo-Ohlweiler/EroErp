package com.api.ero_api.tenant.util;

import java.util.Locale;

/**
 * CPF (11 dígitos) ou CNPJ (14 posições), com dígito verificador.
 *
 * <p>Aceita o CNPJ alfanumérico da Receita (IN RFB 2.229/2024, emitido desde
 * julho/2026): as 12 primeiras posições podem ter letras e as 2 últimas são
 * dígitos. No cálculo, cada caractere vale o seu código ASCII − 48 (0–9 → 0–9,
 * A → 17, B → 18...), exatamente como a Receita define.
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

    /** Recebe o valor já normalizado. */
    public static boolean valido(String doc) {
        if (doc == null || doc.isEmpty() || doc.chars().distinct().count() == 1) {
            return false;
        }
        if (doc.length() == 11 && doc.matches("\\d{11}")) {
            return cpfValido(doc);
        }
        if (doc.length() == 14 && doc.matches("[0-9A-Z]{12}\\d{2}")) {
            return digitoCnpj(doc, PESOS_CNPJ_1) == doc.charAt(12) - '0'
                    && digitoCnpj(doc, PESOS_CNPJ_2) == doc.charAt(13) - '0';
        }
        return false;
    }

    private static boolean cpfValido(String d) {
        return digitoCpf(d, 9, 10) == d.charAt(9) - '0' && digitoCpf(d, 10, 11) == d.charAt(10) - '0';
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
