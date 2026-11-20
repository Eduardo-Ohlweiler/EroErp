package com.api.ero_api.seguranca;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.net.URI;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
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

    /**
     * O Spring MVC decodifica o caminho antes de casar a rota: {@code /api/%63ep/...} chega
     * ao controller de CEP. Precisa contar no balde do CEP, e não no geral (10× maior).
     */
    @Test
    void cepComCaminhoCodificadoContaNoBaldeDoCep() {
        String ip = "10.20.0.1";
        assertThat(status(getDe(ip, "/api/cep/01001000"))).isEqualTo(401);
        assertThat(status(getDe(ip, "/api/%63ep/01001000"))).as("codificado conta no mesmo balde").isEqualTo(401);
        assertThat(status(getDe(ip, "/api/c%65p/01001000"))).isEqualTo(401);

        MvcTestResult r = getDe(ip, "/api/%63%65p/01001000");
        assertThat(status(r)).isEqualTo(429);
        assertThat(r.getResponse().getHeader("Retry-After")).isNotBlank();
        assertThat(status(getDe(ip, "/api/cidades/selecao"))).as("o resto da API segue no balde geral").isEqualTo(401);
    }

    /**
     * Login com caminho codificado ({@code /api/auth/%6Cogin}) não é recusado antes: o Spring
     * Security e o Spring MVC o tratam como o login (401 de credencial errada). Por isso ele
     * precisa contar no balde do login, junto com o caminho normal.
     */
    @Test
    void loginComCaminhoCodificadoContaNoBaldeDoLogin() {
        String ip = "10.20.0.2";
        assertThat(status(loginDe(ip, "/api/auth/login"))).isEqualTo(401);
        assertThat(status(loginDe(ip, "/api/auth/%6Cogin"))).as("chega ao login, mesmo codificado").isEqualTo(401);
        assertThat(status(loginDe(ip, "/api/auth/%6c%6fgin"))).isEqualTo(401);

        MvcTestResult r = loginDe(ip, "/api/auth/%6Cogin");
        assertThat(status(r)).isEqualTo(429);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo("MUITAS_REQUISICOES");
    }

    // URI pronta (já codificada): uri(String) codificaria o '%' de novo. IP próprio para não
    // dividir balde com os outros testes desta classe.
    private MvcTestResult getDe(String ip, String caminho) {
        return mvc.get().uri(URI.create(caminho))
                .with(req -> {
                    req.setRemoteAddr(ip);
                    return req;
                })
                .exchange();
    }

    private MvcTestResult loginDe(String ip, String caminho) {
        return mvc.post().uri(URI.create(caminho))
                .with(req -> {
                    req.setRemoteAddr(ip);
                    return req;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "ninguem@teste.local", "senha", "Senha-Errada-Total-1")))
                .exchange();
    }
}
