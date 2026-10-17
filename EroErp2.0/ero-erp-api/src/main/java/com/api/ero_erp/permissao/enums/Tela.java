package com.api.ero_erp.permissao.enums;

/**
 * O catálogo de telas que se libera por usuário. É código, e não tabela: uma
 * tela só existe se existe o código dela.
 *
 * <p>Cada tela vira duas authorities no {@code JwtFilter}: {@code <TELA>_LER}
 * (leitura ou escrita) e {@code <TELA>_ESCREVER} (só escrita). O controller
 * protege os GET com a primeira e as escritas com a segunda:
 *
 * <pre>
 * &#64;PreAuthorize("hasAuthority('PESSOAS_LER')")
 * &#64;PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
 * </pre>
 *
 * <p>O nome da constante é gravado em {@code usuario_permissao.tela} e viaja
 * para o front: renomear uma constante exige migration.
 */
public enum Tela {

    PESSOAS(Modulo.PESSOAS, "Pessoas"),
    FILIAIS(Modulo.FILIAIS, "Filiais"),
    SERVICOS(Modulo.SERVICOS, "Serviços"),
    PRODUTOS(Modulo.PRODUTOS, "Produtos"),
    AUXILIARES_PRODUTO(Modulo.PRODUTOS, "Auxiliares de produto"),
    ESTOQUE(Modulo.ESTOQUE, "Estoque");

    private final Modulo modulo;
    private final String rotulo;

    Tela(Modulo modulo, String rotulo) {
        this.modulo = modulo;
        this.rotulo = rotulo;
    }

    public Modulo modulo() {
        return modulo;
    }

    public String rotulo() {
        return rotulo;
    }

    public String authorityLer() {
        return name() + "_LER";
    }

    public String authorityEscrever() {
        return name() + "_ESCREVER";
    }
}
