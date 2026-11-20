package com.api.ero_api.pessoa;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.pessoa.util.OrdemUuid;
import com.api.ero_api.support.IntegracaoTest;
import java.util.Random;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * O {@code ck_pessoa_vinculo_ordem} usa o {@code uuid <} do PostgreSQL. O Java precisa da
 * mesma ordem para montar a linha do vínculo; aqui ela é conferida contra o próprio banco
 * (Testcontainers) em 1.000 pares aleatórios.
 */
class OrdemUuidTest extends IntegracaoTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void mesmaOrdemDoPostgres() {
        Random sorteio = new Random(20261116L);
        int errosDoCompareTo = 0;
        for (int i = 0; i < 1000; i++) {
            UUID a = new UUID(sorteio.nextLong(), sorteio.nextLong());
            UUID b = i % 10 == 0 ? new UUID(a.getMostSignificantBits(), sorteio.nextLong())
                    : new UUID(sorteio.nextLong(), sorteio.nextLong());
            Boolean antesNoBanco = jdbc.queryForObject("SELECT CAST(? AS uuid) < CAST(? AS uuid)", Boolean.class,
                    a.toString(), b.toString());
            assertThat(OrdemUuid.antes(a, b)).as("%s < %s", a, b).isEqualTo(antesNoBanco);
            if ((a.compareTo(b) < 0) != antesNoBanco) {
                errosDoCompareTo++;
            }
        }
        // O UUID.compareTo compara com sinal: se alguém trocar a OrdemUuid por ele, este teste pega.
        assertThat(errosDoCompareTo).as("pares em que o UUID.compareTo discorda do banco").isPositive();
    }
}
