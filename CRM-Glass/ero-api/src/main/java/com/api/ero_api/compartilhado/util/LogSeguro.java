package com.api.ero_api.compartilhado.util;

/**
 * Mascara dado pessoal antes de ir para o log (LGPD / OWASP A09).
 *
 * <p>Regra: log NUNCA recebe senha, token, segredo, CPF, e-mail ou telefone
 * inteiros. Prefira logar o id (UUID). Se precisar do dado, passe por aqui.
 */
public final class LogSeguro {

    private LogSeguro() {
    }

    /** {@code eduardo@empresa.com.br} vira {@code e*****@e*****.com.br}. */
    public static String email(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] partes = email.split("@", 2);
        String dominio = partes[1];
        int ponto = dominio.indexOf('.');
        String nomeDominio = ponto > 0 ? dominio.substring(0, ponto) : dominio;
        String resto = ponto > 0 ? dominio.substring(ponto) : "";
        return primeira(partes[0]) + "@" + primeira(nomeDominio) + resto;
    }

    /** Mantém só os 2 últimos dígitos. */
    public static String documento(String doc) {
        return mascararDigitos(doc, 2);
    }

    /** Mantém só os 4 últimos dígitos. */
    public static String telefone(String tel) {
        return mascararDigitos(tel, 4);
    }

    private static String mascararDigitos(String valor, int visiveis) {
        if (valor == null) {
            return "***";
        }
        String digitos = valor.replaceAll("\\D", "");
        if (digitos.length() <= visiveis) {
            return "***";
        }
        return "*".repeat(digitos.length() - visiveis) + digitos.substring(digitos.length() - visiveis);
    }

    private static String primeira(String s) {
        return s.isEmpty() ? "***" : s.charAt(0) + "*****";
    }
}
