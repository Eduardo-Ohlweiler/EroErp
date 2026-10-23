package com.api.ero_erp.config;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * O balde do login e do refresh. Os testes rodam com limite de 1000; aqui ele
 * desce a 3 e volta no fim, com o mapa limpo dos dois lados.
 */
@DisplayName("Rate limit de login e refresh")
class RateLimitTest extends AbstractIntegrationTest {

    @Autowired RateLimitFilter rateLimitFilter;

    private Object limiteOriginal;

    @BeforeEach
    void limiteBaixo() {
        limiteOriginal = ReflectionTestUtils.getField(rateLimitFilter, "limitePorMinuto");
        ReflectionTestUtils.setField(rateLimitFilter, "limitePorMinuto", 3);
        baldes().clear();
    }

    @AfterEach
    void restaurar() {
        ReflectionTestUtils.setField(rateLimitFilter, "limitePorMinuto", limiteOriginal);
        baldes().clear();
    }

    /**
     * O balde é da conexão. Com a chave tirada do X-Forwarded-For, trocar o
     * cabeçalho a cada tentativa dava um balde novo a cada chute.
     */
    @Test
    @DisplayName("trocar o X-Forwarded-For não dá balde novo: a 4ª tentativa é 429")
    void xForwardedForNaoAbreBaldeNovo() throws Exception {
        for (int i = 1; i <= 3; i++) {
            refreshInvalido("198.51.100." + i).andExpect(status().isUnauthorized());
        }
        refreshInvalido("198.51.100.4").andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("baldes ociosos saem do mapa: 20 conexões, 5 minutos depois sobra nenhum")
    void baldesOciososSaem() throws Exception {
        for (int i = 1; i <= 20; i++) {
            String ip = "192.0.2." + i;
            mockMvc.perform(post("/auth/refresh")
                            .with(r -> { r.setRemoteAddr(ip); return r; })
                            .contentType("application/json")
                            .content("{\"refreshToken\":\"invalido\"}"))
                    .andExpect(status().isUnauthorized());
        }
        assertThat(baldes()).hasSize(20);

        rateLimitFilter.expurgarOciosos(Instant.now().plus(Duration.ofMinutes(5)));

        assertThat(baldes()).isEmpty();
    }

    @Test
    @DisplayName("balde em uso não sai no expurgo")
    void baldeEmUsoFica() throws Exception {
        refreshInvalido("198.51.100.9").andExpect(status().isUnauthorized());

        rateLimitFilter.expurgarOciosos(Instant.now());

        assertThat(baldes()).hasSize(1);
    }

    private org.springframework.test.web.servlet.ResultActions refreshInvalido(String xff) throws Exception {
        return mockMvc.perform(post("/auth/refresh")
                .header("X-Forwarded-For", xff)
                .contentType("application/json")
                .content("{\"refreshToken\":\"invalido\"}"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, ?> baldes() {
        return (Map<String, ?>) ReflectionTestUtils.getField(rateLimitFilter, "baldes");
    }
}
