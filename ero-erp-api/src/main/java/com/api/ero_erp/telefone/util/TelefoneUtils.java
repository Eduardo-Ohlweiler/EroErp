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

    /**
     * Variantes de um número COMPLETO (DDI+DDD+número) para busca: o padrão brasileiro
     * tem o nono dígito (ex.: 55 51 992006747), mas o WhatsApp identifica contas antigas
     * pelo número SEM o 9 no remoteJid (ex.: 55 51 92006747). As duas formas devem ser
     * tratadas como o mesmo contato. Para números não-brasileiros retorna só o próprio.
     */
    public static java.util.List<String> variantes(String numeroCompleto) {
        java.util.List<String> variantes = new java.util.ArrayList<>(2);
        variantes.add(numeroCompleto);
        if (numeroCompleto != null && numeroCompleto.startsWith(DDI_PADRAO)) {
            // 55 + DDD(2) + 9 + número(8) = 13 dígitos → variante sem o nono dígito
            if (numeroCompleto.length() == 13 && numeroCompleto.charAt(4) == '9') {
                variantes.add(numeroCompleto.substring(0, 4) + numeroCompleto.substring(5));
            }
            // 55 + DDD(2) + número(8) = 12 dígitos → variante com o nono dígito
            else if (numeroCompleto.length() == 12) {
                variantes.add(numeroCompleto.substring(0, 4) + "9" + numeroCompleto.substring(4));
            }
        }
        return variantes;
    }

    /**
     * Forma canônica de um número COMPLETO para comparação de igualdade: remove o nono
     * dígito de números brasileiros, de modo que as duas variantes gerem a mesma chave.
     */
    public static String canonico(String numeroCompleto) {
        if (numeroCompleto != null && numeroCompleto.startsWith(DDI_PADRAO)
                && numeroCompleto.length() == 13 && numeroCompleto.charAt(4) == '9') {
            return numeroCompleto.substring(0, 4) + numeroCompleto.substring(5);
        }
        return numeroCompleto;
    }
}
