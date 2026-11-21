package com.api.ero_api.pessoa.enums;

/**
 * Física ou jurídica (enum fixo, decisão do dono de 16/11/2026). Cada tipo tem os seus
 * campos: na física, CPF, RG, nascimento e sexo; na jurídica, CNPJ, nome fantasia e
 * inscrições. O campo do outro tipo fica sempre nulo ({@code ck_pessoa_campos_do_tipo}).
 */
public enum TipoPessoa {

    FISICA("Física"),
    JURIDICA("Jurídica");

    private final String rotulo;

    TipoPessoa(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
