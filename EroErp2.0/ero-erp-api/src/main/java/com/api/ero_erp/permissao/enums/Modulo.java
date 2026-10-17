package com.api.ero_erp.permissao.enums;

/**
 * Grupo de telas — o que o cadastro de usuário mostra como "módulo" a liberar.
 *
 * <p>A ordem das constantes é a ordem em que a tela de usuário os apresenta.
 * Cada módulo trazido do EroErp antigo entra aqui, com as telas dele em
 * {@link Tela}. A área administrativa não é módulo: é do superadmin pela role.
 */
public enum Modulo {

    CADASTROS("Cadastros");

    private final String rotulo;

    Modulo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
