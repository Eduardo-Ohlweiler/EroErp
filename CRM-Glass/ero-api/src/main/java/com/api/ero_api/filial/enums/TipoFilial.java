package com.api.ero_api.filial.enums;

/**
 * Matriz ou filial (como no EroErp 2.0). Pode haver várias matrizes no contratante; a
 * filial responde a uma matriz, que é sempre do tipo MATRIZ ({@code ck_filial_tipo_matriz}
 * e o service, com trava).
 */
public enum TipoFilial {

    MATRIZ("Matriz"),
    FILIAL("Filial");

    private final String rotulo;

    TipoFilial(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }
}
