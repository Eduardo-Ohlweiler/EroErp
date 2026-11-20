package com.api.ero_api.pessoa.util;

import java.util.Comparator;
import java.util.UUID;

/**
 * A ordem do {@code uuid <} do PostgreSQL no Java: comparação dos 16 bytes sem sinal.
 *
 * <p>O vínculo grava sempre {@code pessoa_origem_id < pessoa_destino_id}
 * ({@code ck_pessoa_vinculo_ordem}); o Java precisa saber, antes de inserir, qual das
 * duas vem primeiro. O {@link UUID#compareTo} compara com sinal e NÃO serve: para
 * metades com o bit mais alto ligado ele dá o contrário do banco.
 */
public final class OrdemUuid {

    public static final Comparator<UUID> COMO_NO_BANCO = Comparator
            .comparing(UUID::getMostSignificantBits, Long::compareUnsigned)
            .thenComparing(UUID::getLeastSignificantBits, Long::compareUnsigned);

    private OrdemUuid() {
    }

    /** {@code a} vem antes de {@code b} no banco. */
    public static boolean antes(UUID a, UUID b) {
        return COMO_NO_BANCO.compare(a, b) < 0;
    }
}
