package com.api.ero_erp.produto.service;

/**
 * Conferência do EAN/GTIN — 8, 12, 13 ou 14 dígitos, com o último sendo o
 * verificador. O antigo aceitava qualquer texto de até 14 caracteres.
 *
 * <p>O verificador: da direita para a esquerda, sem ele, os dígitos pesam
 * 3, 1, 3, 1…; o verificador é o que falta para a soma chegar à dezena
 * seguinte.
 */
public final class Gtin {

    private Gtin() {}

    /**
     * O motivo da recusa, ou {@code null} quando o código vale. Motivo e não
     * booleano: "só dígitos", "tamanho" e "verificador" são erros diferentes
     * para quem digitou.
     */
    public static String motivoInvalido(String codigo) {
        if (!codigo.matches("\\d+")) {
            return "O EAN aceita só dígitos";
        }
        int tamanho = codigo.length();
        if (tamanho != 8 && tamanho != 12 && tamanho != 13 && tamanho != 14) {
            return "O EAN tem 8, 12, 13 ou 14 dígitos; este tem " + tamanho;
        }
        int esperado = digitoVerificador(codigo.substring(0, tamanho - 1));
        if (codigo.charAt(tamanho - 1) - '0' != esperado) {
            return "O EAN " + codigo + " não confere: o dígito verificador seria " + esperado
                    + ". Confira a digitação";
        }
        return null;
    }

    static int digitoVerificador(String semVerificador) {
        int soma = 0;
        boolean peso3 = true;
        for (int i = semVerificador.length() - 1; i >= 0; i--) {
            int digito = semVerificador.charAt(i) - '0';
            soma += peso3 ? digito * 3 : digito;
            peso3 = !peso3;
        }
        return (10 - soma % 10) % 10;
    }
}
