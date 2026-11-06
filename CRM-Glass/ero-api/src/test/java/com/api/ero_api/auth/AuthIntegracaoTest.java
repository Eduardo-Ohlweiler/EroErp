package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auth.util.Totp;
import com.api.ero_api.support.IntegracaoTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

class AuthIntegracaoTest extends IntegracaoTest {

    @Test
    void loginDoSuperadminDevolveTokenECookieHttpOnly() {
        MvcTestResult r = tentarLogin(SUPERADMIN_EMAIL, SUPERADMIN_SENHA);

        assertThat(status(r)).isEqualTo(200);
        JsonNode c = corpo(r);
        assertThat(c.path("tokenAcesso").asString()).isNotBlank();
        assertThat(c.path("usuario").path("papel").asString()).isEqualTo("SUPERADMIN");
        assertThat(c.has("refreshToken")).as("refresh nunca vai no corpo").isFalse();
        String setCookie = r.getResponse().getHeader("Set-Cookie");
        assertThat(setCookie).contains("ero_refresh=", "HttpOnly", "SameSite=Strict", "Path=/api/auth");

        MvcTestResult eu = get("/api/auth/eu", c.path("tokenAcesso").asString());
        assertThat(status(eu)).isEqualTo(200);
        assertThat(corpo(eu).path("email").asString()).isEqualTo(SUPERADMIN_EMAIL);
    }

    @Test
    void senhaErradaEEmailInexistenteDaoAMesmaMensagem() {
        MvcTestResult senhaErrada = tentarLogin(SUPERADMIN_EMAIL, "Senha-Errada-Total-1");
        MvcTestResult emailInexistente = tentarLogin("ninguem@teste.local", "Senha-Errada-Total-1");

        assertThat(status(senhaErrada)).isEqualTo(401);
        assertThat(status(emailInexistente)).isEqualTo(401);
        assertThat(corpo(senhaErrada).path("detail").asString())
                .isEqualTo(corpo(emailInexistente).path("detail").asString())
                .isEqualTo("E-mail ou senha inválidos.");
    }

    @Test
    void contaBloqueiaDepoisDeCincoErrosMesmoComSenhaCerta() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        for (int i = 0; i < 5; i++) {
            assertThat(status(tentarLogin(u.email(), "Senha-Errada-Total-" + i))).isEqualTo(401);
        }
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("bloqueada").isEqualTo(401);
    }

    @Test
    void semTokenOuComTokenInvalidoDa401() {
        assertThat(status(get("/api/usuarios", null))).isEqualTo(401);
        assertThat(status(get("/api/usuarios", "token.falso.aqui"))).isEqualTo(401);
    }

    @Test
    void refreshGiraOCookieEReusoDerrubaASessao() {
        Sessao s = loginSuperadmin();

        MvcTestResult primeiro = refresh(s.refresh());
        assertThat(status(primeiro)).isEqualTo(200);
        String novoRefresh = cookieRefresh(primeiro);
        assertThat(novoRefresh).isNotBlank().isNotEqualTo(s.refresh());
        String novoToken = corpo(primeiro).path("tokenAcesso").asString();
        assertThat(status(get("/api/auth/eu", novoToken))).isEqualTo(200);

        // Alguém reutiliza o refresh antigo (roubado): a sessão inteira cai.
        assertThat(status(refresh(s.refresh()))).isEqualTo(401);
        assertThat(status(refresh(novoRefresh))).as("o novo também morreu").isEqualTo(401);
        assertThat(status(get("/api/auth/eu", novoToken))).as("token de acesso também").isEqualTo(401);
    }

    @Test
    void refreshSemHeaderAntiCsrfERecusado() {
        Sessao s = loginSuperadmin();
        MvcTestResult r = mvc.post().uri("/api/auth/refresh")
                .cookie(new jakarta.servlet.http.Cookie("ero_refresh", s.refresh())).exchange();
        assertThat(status(r)).isEqualTo(403);
    }

    @Test
    void logoutEncerraASessaoNaHora() {
        Sessao s = loginSuperadmin();
        assertThat(status(get("/api/auth/eu", s.token()))).isEqualTo(200);

        MvcTestResult r = logout(s.refresh());
        assertThat(status(r)).isEqualTo(204);
        assertThat(r.getResponse().getHeader("Set-Cookie")).contains("Max-Age=0");

        assertThat(status(refresh(s.refresh()))).isEqualTo(401);
        assertThat(status(get("/api/auth/eu", s.token()))).isEqualTo(401);
    }

    @Test
    void senhaTemporariaSoPermiteTrocarASenha() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        Sessao s = login(u.email(), SENHA_FORTE);
        assertThat(s.corpo().path("usuario").path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
        assertThat(status(get("/api/usuarios/selecao", s.token()))).as("pendente não vê dados").isEqualTo(403);
        assertThat(status(get("/api/sessoes", s.token()))).isEqualTo(403);
        assertThat(status(get("/api/permissoes/usuarios/" + u.id(), s.token()))).isEqualTo(403);
        assertThat(status(get("/api/auth/eu", s.token()))).as("mas sabe quem é").isEqualTo(200);

        MvcTestResult fraca = put("/api/auth/senha", s.token(), Map.of("senhaAtual", SENHA_FORTE, "novaSenha", "123456789012"));
        assertThat(status(fraca)).isEqualTo(422);

        MvcTestResult troca = put("/api/auth/senha", s.token(), Map.of("senhaAtual", SENHA_FORTE, "novaSenha", SENHA_FORTE_2));
        assertThat(status(troca)).isEqualTo(204);
        assertThat(corpo(get("/api/auth/eu", s.token())).path("pendencia").asString()).isEqualTo("NENHUMA");
    }

    @Test
    void doisFatoresCompleto() {
        Contratante c = novoContratante();
        Sessao admin = c.admin();

        JsonNode config = corpo(post("/api/auth/2fa/configurar", admin.token(), Map.of()));
        String segredo = config.path("segredo").asString();
        assertThat(config.path("uri").asString()).startsWith("otpauth://totp/");

        assertThat(status(post("/api/auth/2fa/ativar", admin.token(),
                Map.of("senha", SENHA_FORTE_2, "codigo", "000000")))).as("código errado").isEqualTo(422);
        assertThat(status(post("/api/auth/2fa/ativar", admin.token(),
                Map.of("senha", "Senha-Errada-Total-1", "codigo", Totp.codigoEm(segredo, Instant.now())))))
                .as("ativar exige a senha").isEqualTo(422);
        MvcTestResult ativar = post("/api/auth/2fa/ativar", admin.token(),
                Map.of("senha", SENHA_FORTE_2, "codigo", Totp.codigoEm(segredo, Instant.now())));
        assertThat(status(ativar)).isEqualTo(200);
        JsonNode codigos = corpo(ativar).path("codigos");
        assertThat(codigos.size()).isEqualTo(10);

        // Login agora pede a segunda etapa.
        MvcTestResult etapa1 = tentarLogin(c.adminEmail(), SENHA_FORTE_2);
        assertThat(status(etapa1)).isEqualTo(200);
        JsonNode e1 = corpo(etapa1);
        assertThat(e1.path("requerDoisFatores").asBoolean()).isTrue();
        assertThat(e1.path("tokenAcesso").isNull()).isTrue();
        assertThat(cookieRefresh(etapa1)).as("sem sessão antes do código").isNull();
        String desafio = e1.path("desafioDoisFatores").asString();

        assertThat(status(post("/api/auth/2fa/verificar", null, Map.of("desafio", desafio, "codigo", "123123"))))
                .isEqualTo(401);

        // Código de recuperação funciona uma única vez.
        String recuperacao = codigos.get(0).asString();
        MvcTestResult etapa2 = post("/api/auth/2fa/verificar", null, Map.of("desafio", desafio, "codigo", recuperacao));
        assertThat(status(etapa2)).isEqualTo(200);
        assertThat(corpo(etapa2).path("tokenAcesso").asString()).isNotBlank();
        assertThat(status(post("/api/auth/2fa/verificar", null, Map.of("desafio", desafio, "codigo", recuperacao))))
                .isEqualTo(401);

        // Código do app (próximo passo de 30 s, porque o atual já foi usado na ativação).
        String proximo = Totp.codigoEm(segredo, Instant.now().plusSeconds(30));
        MvcTestResult comApp = post("/api/auth/2fa/verificar", null, Map.of("desafio", desafio, "codigo", proximo));
        assertThat(status(comApp)).isEqualTo(200);
        String token = corpo(comApp).path("tokenAcesso").asString();

        // Desligar pede senha + código, derruba as outras sessões e o login volta a ser só com senha.
        MvcTestResult outraAba = post("/api/auth/2fa/verificar", null,
                Map.of("desafio", desafio, "codigo", codigos.get(2).asString()));
        String tokenOutraSessao = corpo(outraAba).path("tokenAcesso").asString();
        assertThat(status(post("/api/auth/2fa/desativar", token,
                Map.of("senha", SENHA_FORTE_2, "codigo", "000000")))).isEqualTo(422);
        assertThat(status(post("/api/auth/2fa/desativar", token,
                Map.of("senha", SENHA_FORTE_2, "codigo", codigos.get(1).asString())))).isEqualTo(204);
        assertThat(status(get("/api/auth/eu", tokenOutraSessao))).as("outra sessão caiu").isEqualTo(401);
        assertThat(status(get("/api/auth/eu", token))).as("a atual continua").isEqualTo(200);
        assertThat(corpo(tentarLogin(c.adminEmail(), SENHA_FORTE_2)).path("requerDoisFatores").asBoolean()).isFalse();
    }

    @Test
    void adminRedefineO2faDeQuemPerdeuOCelular() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        String segredo = corpo(post("/api/auth/2fa/configurar", s.token(), Map.of())).path("segredo").asString();
        assertThat(status(post("/api/auth/2fa/ativar", s.token(),
                Map.of("senha", SENHA_FORTE_2, "codigo", Totp.codigoEm(segredo, Instant.now()))))).isEqualTo(200);
        assertThat(corpo(tentarLogin(u.email(), SENHA_FORTE_2)).path("requerDoisFatores").asBoolean()).isTrue();

        assertThat(status(patch("/api/usuarios/" + u.id() + "/redefinir-2fa", c.admin().token()))).isEqualTo(204);

        assertThat(status(get("/api/auth/eu", s.token()))).as("sessões do usuário caíram").isEqualTo(401);
        assertThat(corpo(tentarLogin(u.email(), SENHA_FORTE_2)).path("requerDoisFatores").asBoolean()).isFalse();
    }

    @Test
    void trocaDeSenhaRespeitaOBloqueio() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        for (int i = 0; i < 5; i++) {
            put("/api/auth/senha", s.token(), Map.of("senhaAtual", "Chute-Errado-" + i + "-xyz", "novaSenha", "Qualquer-Nova-2026"));
        }
        // Bloqueada: nem a senha certa troca, e o login também fica travado.
        MvcTestResult certa = put("/api/auth/senha", s.token(),
                Map.of("senhaAtual", SENHA_FORTE_2, "novaSenha", "Qualquer-Nova-2026"));
        assertThat(status(certa)).isEqualTo(422);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE_2))).isEqualTo(401);
    }

    @Test
    void erroDeValidacaoVemComCamposEEmPortugues() {
        MvcTestResult r = post("/api/auth/login", null, Map.of("email", "", "senha", ""));
        assertThat(status(r)).isEqualTo(400);
        JsonNode c = corpo(r);
        assertThat(c.path("codigo").asString()).isEqualTo("VALIDACAO");
        assertThat(c.path("erros").size()).isEqualTo(2);
        assertThat(c.path("correlationId").asString()).isNotBlank();
    }

    @Test
    void respostasTemCabecalhosDeSeguranca() {
        MvcTestResult r = tentarLogin(SUPERADMIN_EMAIL, SUPERADMIN_SENHA);
        assertThat(r.getResponse().getHeader("Content-Security-Policy")).contains("frame-ancestors 'none'");
        assertThat(r.getResponse().getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(r.getResponse().getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(r.getResponse().getHeader("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(r.getResponse().getHeader("X-Correlation-Id")).isNotBlank();
    }

    @Test
    void rotaInexistenteNaoVazaDetalhe() {
        Sessao s = loginSuperadmin();
        MvcTestResult r = get("/api/nao-existe", s.token());
        assertThat(status(r)).isEqualTo(404);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Recurso não encontrado.");
    }
}
