package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/** Login, sessão e senha. O código por e-mail tem os testes próprios em CodigoVerificacaoIntegracaoTest. */
class AuthIntegracaoTest extends IntegracaoTest {

    @Test
    void loginDoSuperadminTambemPedeCodigoEDepoisDevolveTokenECookieHttpOnly() {
        String desafio = desafio(SUPERADMIN_EMAIL, SUPERADMIN_SENHA);

        MvcTestResult r = verificarCodigo(desafio, caixa.ultimoCodigoPara(SUPERADMIN_EMAIL));
        assertThat(status(r)).isEqualTo(200);
        JsonNode c = corpo(r);
        assertThat(c.path("requerDoisFatores").asBoolean()).isFalse();
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
    void senhaErradaEEmailInexistenteDaoAMesmaMensagemENaoMandamEmail() {
        long antes = caixa.quantosPara(SUPERADMIN_EMAIL);
        MvcTestResult senhaErrada = tentarLogin(SUPERADMIN_EMAIL, "Senha-Errada-Total-1");
        MvcTestResult emailInexistente = tentarLogin("ninguem@teste.local", "Senha-Errada-Total-1");

        assertThat(status(senhaErrada)).isEqualTo(401);
        assertThat(status(emailInexistente)).isEqualTo(401);
        assertThat(corpo(senhaErrada).path("detail").asString())
                .isEqualTo(corpo(emailInexistente).path("detail").asString())
                .isEqualTo("E-mail ou senha inválidos.");
        assertThat(caixa.quantosPara(SUPERADMIN_EMAIL)).as("código só depois da senha certa").isEqualTo(antes);
    }

    @Test
    void contaBloqueiaDepoisDeCincoErrosMesmoComSenhaCerta() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        for (int i = 0; i < 5; i++) {
            assertThat(status(tentarLogin(u.email(), "Senha-Errada-Total-" + i))).isEqualTo(401);
        }
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("bloqueada").isEqualTo(401);
        assertThat(caixa.quantosPara(u.email())).as("bloqueada não recebe código").isZero();
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

        Sessao s = loginComCodigo(u.email(), SENHA_FORTE);
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
    void euTrazAparenciaESemCamposDoAppAutenticador() {
        Contratante c = novoContratante();
        JsonNode eu = corpo(get("/api/auth/eu", c.admin().token()));
        assertThat(eu.path("pendencia").asString()).isEqualTo("NENHUMA");
        assertThat(eu.path("aparencia").path("temaPadrao").asString()).isNotBlank();
        assertThat(eu.has("corDestaque")).as("cor agora vem dentro de aparencia").isFalse();
        assertThat(eu.has("doisFatoresAtivo")).as("2FA é sempre por e-mail: não há o que ligar").isFalse();
        assertThat(eu.has("doisFatoresObrigatorio")).isFalse();

        Sessao s = loginSuperadmin();
        assertThat(corpo(get("/api/auth/eu", s.token())).path("pendencia").asString())
                .as("superadmin não tem pendência de configurar nada").isEqualTo("NENHUMA");

        // As rotas do app autenticador deixaram de existir.
        assertThat(status(post("/api/auth/2fa/configurar", c.admin().token(), Map.of()))).isEqualTo(404);
        assertThat(status(post("/api/auth/2fa/ativar", c.admin().token(), Map.of("senha", "x", "codigo", "1")))).isEqualTo(404);
        String adminId = c.admin().corpo().path("usuario").path("id").asString();
        assertThat(status(patch("/api/usuarios/" + adminId + "/redefinir-2fa", s.token()))).isEqualTo(404);
    }

    @Test
    void rotaInexistenteNaoVazaDetalhe() {
        Sessao s = loginSuperadmin();
        MvcTestResult r = get("/api/nao-existe", s.token());
        assertThat(status(r)).isEqualTo(404);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Recurso não encontrado.");
    }
}
