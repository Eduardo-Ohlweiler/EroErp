package com.api.ero_erp.telefone.util;

/**
 * Utilitários de telefone/DDI compartilhados por toda a aplicação.
 * Centraliza a normalização do código do país (DDI) para evitar duplicação de lógica.
 */
public final class TelefoneUtils {

    /** Código do país (DDI) padrão quando nenhum for informado (Brasil). */
    public static final String DDI_PADRAO = "55";

    private TelefoneUtils() {
    }

    /**
     * Normaliza o código do país (DDI). Retorna "55" (Brasil) quando o valor é
     * null ou em branco; caso contrário retorna apenas os dígitos informados.
     */
    public static String defaultDdi(String codigoPais) {
        if (codigoPais == null || codigoPais.isBlank())
            return DDI_PADRAO;
        String digitos = codigoPais.replaceAll("\\D", "");
        return digitos.isBlank() ? DDI_PADRAO : digitos;
    }

    /** Remove tudo que não é dígito do número (DDD + número). */
    public static String limparNumero(String numero) {
        return numero == null ? "" : numero.replaceAll("\\D", "");
    }

    /**
     * Monta o número completo para envio (Evolution/WhatsApp): DDI + DDD + número,
     * usando o DDI normalizado e o número apenas com dígitos.
     */
    public static String montarNumeroEnvio(String codigoPais, String numero) {
        return defaultDdi(codigoPais) + limparNumero(numero);
    }
}
