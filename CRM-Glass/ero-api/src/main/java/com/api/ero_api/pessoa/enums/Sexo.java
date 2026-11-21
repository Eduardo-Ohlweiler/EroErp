package com.api.ero_api.pessoa.enums;

/** Sexo da pessoa física (opcional; nulo = não informado). */
public enum Sexo {

    MASCULINO("Masculino"),
    FEMININO("Feminino");

    private final String rotulo;

    Sexo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
