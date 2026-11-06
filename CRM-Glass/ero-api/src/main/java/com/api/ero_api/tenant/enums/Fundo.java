package com.api.ero_api.tenant.enums;

/**
 * Catálogo de fundos. O código gravado no banco é o {@code name()}; o front
 * mapeia para o id minúsculo de {@code cenas.ts}.
 *
 * <p>Cena {@code exclusiva} é feita para um contratante só: ela só pode ser usada
 * por quem está vinculado a ela em {@code tenant.fundo_exclusivo} (índice único).
 * Cena exclusiva nova leva nome neutro (ex.: {@code EXCLUSIVA_01}), para o
 * catálogo não revelar quem é o cliente. Passo a passo em docs/06-fundos-de-cena.md.
 */
public enum Fundo {

    ORBS("Orbs", TipoFundo.VIVO, false),
    AURORA("Aurora", TipoFundo.VIVO, false),
    ONDAS("Ondas", TipoFundo.VIVO, false),
    MINIMO("Mínimo", TipoFundo.VIVO, false),
    ESCRITORIO("Escritório", TipoFundo.CENA, false),
    CIDADE("Cidade", TipoFundo.CENA, false),
    MARINA("Marina", TipoFundo.CENA, false),
    EXPEDIENTE("Expediente", TipoFundo.CENA, false),
    COWORKING("Coworking", TipoFundo.CENA, false);

    private final String rotulo;
    private final TipoFundo tipo;
    private final boolean exclusiva;

    Fundo(String rotulo, TipoFundo tipo, boolean exclusiva) {
        this.rotulo = rotulo;
        this.tipo = tipo;
        this.exclusiva = exclusiva;
    }

    public String rotulo() {
        return rotulo;
    }

    public TipoFundo tipo() {
        return tipo;
    }

    public boolean exclusiva() {
        return exclusiva;
    }
}
