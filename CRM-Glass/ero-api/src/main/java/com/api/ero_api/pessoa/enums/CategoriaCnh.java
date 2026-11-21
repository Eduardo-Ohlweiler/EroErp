package com.api.ero_api.pessoa.enums;

/**
 * Categoria da CNH (lista fechada: CHECK {@code ck_pessoa_cnh_categoria} na migration 020).
 * Opcional, e só existe com o número da CNH.
 */
public enum CategoriaCnh {

    A, B, AB, C, D, E, AC, AD, AE;

    /** O rótulo é a própria sigla ("AB"). */
    public String rotulo() {
        return name();
    }
}
