package com.api.ero_api.auxiliar.enums;

/**
 * Itens do sistema do Tipo de cadastro, semeados em cada contratante (imutáveis).
 *
 * <p>O nome da constante é a {@code chave} gravada; o código do item é
 * {@code ordinal() + 1}. Os valores são IGUAIS aos da migration 014. Item novo: só no
 * fim, junto com a migration que semeia os contratantes existentes (docs/05).
 */
public enum TipoCadastroDoSistema {

    CLIENTE("Cliente"),
    FORNECEDOR("Fornecedor"),
    FUNCIONARIO("Funcionário"),
    LEAD("Lead"),
    OUTROS("Outros");

    private final String rotulo;

    TipoCadastroDoSistema(String rotulo) {
        this.rotulo = rotulo;
    }

    public String rotulo() {
        return rotulo;
    }

    /** Código do item no contratante: 1..N na ordem da declaração. */
    public long codigo() {
        return ordinal() + 1L;
    }
}
