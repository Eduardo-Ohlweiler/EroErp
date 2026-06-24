package com.api.ero_erp.pessoavinculo.enums;

public enum TipoVinculo {

    RESPONSAVEL("Responsável"),
    DEPENDENTE("Dependente"),
    CONJUGE("Cônjuge"),
    FAMILIAR("Familiar");

    private final String descricao;

    TipoVinculo(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Tipo do vínculo visto pelo "outro lado" da relação.
     * Apenas RESPONSAVEL/DEPENDENTE são inversos entre si;
     * os demais são simétricos (mesmo rótulo nos dois lados).
     */
    public TipoVinculo inverso() {
        return switch (this) {
            case RESPONSAVEL -> DEPENDENTE;
            case DEPENDENTE  -> RESPONSAVEL;
            default          -> this;
        };
    }
}
