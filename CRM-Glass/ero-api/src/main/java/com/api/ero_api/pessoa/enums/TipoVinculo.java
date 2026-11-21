package com.api.ero_api.pessoa.enums;

/**
 * Tipo de vínculo entre duas pessoas. Leitura: "B é &lt;tipo&gt; de A". Visto do outro
 * lado, o tipo vira o {@link #inverso()}: se B é DEPENDENTE de A, A é RESPONSAVEL de B.
 *
 * <p>Lista fechada (CHECK na migration 018, recriado na 021): os 4 do EroErp 2.0,
 * Contato/Empresa (P1 do dono, 16/11/2026) e Representante legal/Empresa representada
 * (P1 do dono, 20/11/2026). O lado EMPRESA e o lado REPRESENTADA são sempre pessoa
 * jurídica; o REPRESENTANTE_LEGAL é sempre pessoa física. Constante nova vai no fim.
 */
public enum TipoVinculo {

    RESPONSAVEL("Responsável"),
    DEPENDENTE("Dependente"),
    CONJUGE("Cônjuge"),
    FAMILIAR("Familiar"),
    CONTATO("Contato"),
    EMPRESA("Empresa"),
    REPRESENTANTE_LEGAL("Representante legal"),
    REPRESENTADA("Empresa representada");

    private final String rotulo;

    TipoVinculo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }

    /** O mesmo vínculo visto da outra pessoa. */
    public TipoVinculo inverso() {
        return switch (this) {
            case RESPONSAVEL -> DEPENDENTE;
            case DEPENDENTE -> RESPONSAVEL;
            case CONTATO -> EMPRESA;
            case EMPRESA -> CONTATO;
            case REPRESENTANTE_LEGAL -> REPRESENTADA;
            case REPRESENTADA -> REPRESENTANTE_LEGAL;
            case CONJUGE, FAMILIAR -> this;
        };
    }
}
