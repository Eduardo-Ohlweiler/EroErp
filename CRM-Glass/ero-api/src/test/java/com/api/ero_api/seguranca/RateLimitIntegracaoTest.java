package com.api.ero_api.seguranca;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@TestPropertySource(properties = "app.rate-limit.login=3")
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
}
