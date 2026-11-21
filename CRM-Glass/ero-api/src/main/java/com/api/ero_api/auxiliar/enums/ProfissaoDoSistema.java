package com.api.ero_api.auxiliar.enums;

/**
 * Itens do sistema da Profissão, semeados em cada contratante (imutáveis). Genéricos,
 * sem a tabela CBO: o contratante cadastra as profissões que usa.
 *
 * <p>O nome da constante é a {@code chave} gravada; o código do item é
 * {@code ordinal() + 1}. Os valores são IGUAIS aos da migration 019. Item novo: só no
 * fim, junto com a migration que semeia os contratantes existentes (docs/05).
 */
public enum ProfissaoDoSistema {

    AUTONOMO("Autônomo(a)"),
    EMPRESARIO("Empresário(a)"),
    SERVIDOR_PUBLICO("Servidor(a) público(a)"),
    PROFISSIONAL_LIBERAL("Profissional liberal"),
    APOSENTADO("Aposentado(a)"),
    ESTUDANTE("Estudante"),
    DO_LAR("Do lar");

    private final String rotulo;

    ProfissaoDoSistema(String rotulo) {
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
