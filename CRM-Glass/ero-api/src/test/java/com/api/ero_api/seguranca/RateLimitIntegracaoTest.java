package com.api.ero_api.seguranca;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@TestPropertySource(properties = {"app.rate-limit.login=3", "app.rate-limit.dois-fatores=3", "app.rate-limit.cep=3"})
class RateLimitIntegracaoTest extends IntegracaoTest {

    @Test
    void quartaTentativaDeLoginNoMesmoMinutoDa429() {
        for (int i = 0; i < 3; i++) {
            assertThat(status(tentarLogin("ninguem@teste.local", "Senha-Errada-Total-1"))).isEqualTo(401);
        }
        MvcTestResult r = tentarLogin("ninguem@teste.local", "Senha-Errada-Total-1");
        assertThat(status(r)).isEqualTo(429);
        assertThat(r.getResponse().getHeader("Retry-After")).isNotBlank();
        assertThat(corpo(r).path("codigo").asString()).isEqualTo("MUITAS_REQUISICOES");
    }

    @Test
    void verificarEReenviarCodigoDividemOMesmoBalde() {
        assertThat(status(verificarCodigo("desafio.invalido.x", "123456"))).isEqualTo(401);
        assertThat(status(reenviarCodigo("desafio.invalido.x"))).isEqualTo(422);
        assertThat(status(verificarCodigo("desafio.invalido.x", "123456"))).isEqualTo(401);

        MvcTestResult r = reenviarCodigo("desafio.invalido.x");
        assertThat(status(r)).isEqualTo(429);
        assertThat(r.getResponse().getHeader("Retry-After")).isNotBlank();
    }

    /** Consulta de CEP tem balde próprio: cada uma vira uma chamada ao ViaCEP (abuso e custo). */
    @Test
    void quartaConsultaDeCepNoMesmoMinutoDa429() {
        for (int i = 0; i < 3; i++) {
            assertThat(status(get("/api/cep/01001000", null))).as("sem sessão, mas conta").isEqualTo(401);
        }
        MvcTestResult r = get("/api/cep/01001000", null);
        assertThat(status(r)).isEqualTo(429);
        assertThat(r.getResponse().getHeader("Retry-After")).isNotBlank();
        assertThat(status(get("/api/cidades/selecao", null))).as("o resto da API segue no balde geral").isEqualTo(401);
    }
}
