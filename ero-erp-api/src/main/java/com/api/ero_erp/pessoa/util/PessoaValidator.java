package com.api.ero_erp.pessoa.util;

public class PessoaValidator {

    private PessoaValidator() {}

    public static boolean validarCPF(String cpf) {
        if (cpf == null) return false;

        cpf = cpf.replaceAll("\\D", "");

        if (cpf.length() != 11 || cpf.matches("(\\d)\\1{10}")) return false;

        for (int t = 9; t < 11; t++) {
            int soma = 0;
            for (int i = 0; i < t; i++) {
                soma += Character.getNumericValue(cpf.charAt(i)) * ((t + 1) - i);
            }
            int resto = (soma * 10) % 11;
            if (resto == 10) resto = 0;
            if (Character.getNumericValue(cpf.charAt(t)) != resto) return false;
        }

        return true;
    }

    public static boolean validarCNPJ(String cnpj) {
        if (cnpj == null) return false;

        cnpj = cnpj.replaceAll("\\D", "");

        if (cnpj.length() != 14 || cnpj.matches("(\\d)\\1{13}")) return false;

        int[] pesos1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesos2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

        for (int t = 12; t < 14; t++) {
            int soma = 0;
            int[] pesos = (t == 12) ? pesos1 : pesos2;
            for (int i = 0; i < t; i++) {
                soma += Character.getNumericValue(cnpj.charAt(i)) * pesos[i];
            }
            int resto = soma % 11;
            int digito = (resto < 2) ? 0 : 11 - resto;
            if (Character.getNumericValue(cnpj.charAt(t)) != digito) return false;
        }

        return true;
    }

    public static boolean validarRG(String rg) {
        if (rg == null) return false;
        String sanitized = rg.replaceAll("[^0-9Xx]", "");
        return sanitized.length() >= 6 && sanitized.length() <= 10;
    }

    public static boolean validarInscricaoEstadual(String inscricao) {
        if (inscricao == null) return false;
        String sanitized = inscricao.replaceAll("\\D", "");
        return sanitized.length() >= 5 && sanitized.length() <= 12;
    }

    public static boolean validarInscricaoMunicipal(String inscricao) {
        if (inscricao == null) return false;
        String sanitized = inscricao.replaceAll("\\D", "");
        return sanitized.length() >= 5 && sanitized.length() <= 12;
    }

    public static boolean validarCNH(String cnh) {
        if (cnh == null) return false;
        String sanitized = cnh.replaceAll("\\D", "");
        return sanitized.length() == 11;
    }
}