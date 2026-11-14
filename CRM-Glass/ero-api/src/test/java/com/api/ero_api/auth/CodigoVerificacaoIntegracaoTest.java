package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.api.ero_api.auth.service.CodigoVerificacaoService;
import com.api.ero_api.support.CaixaDeEmailFake.Recebido;
import com.api.ero_api.support.IntegracaoTest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Segunda etapa do login: código de 6 dígitos por e-mail, para todos, sempre.
 * Vale 10 min do 1º envio, uso único, reenvio do mesmo código (60 s entre envios,
 * no máximo 5 envios) e erro de código no mesmo contador da senha.
 */
class CodigoVerificacaoIntegracaoTest extends IntegracaoTest {

    private static final String MSG_TEMPO = "O tempo para digitar o código acabou. Entre de novo.";
    private static final String DESAFIO_EXPIRADO = "DESAFIO_EXPIRADO";
    private static final String CODIGO_INVALIDO = "CODIGO_INVALIDO";

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private CodigoVerificacaoService codigoVerificacaoService;

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_loginMandaCodigoPorEmailEOCodigoAbreASessao() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Instant antes = Instant.now();

        MvcTestResult etapa1 = tentarLogin(u.email(), SENHA_FORTE);
        assertThat(status(etapa1)).isEqualTo(200);
        JsonNode e1 = corpo(etapa1);
        assertThat(e1.path("requerDoisFatores").asBoolean()).isTrue();
        assertThat(e1.path("desafioDoisFatores").asString()).isNotBlank();
        assertThat(e1.path("tokenAcesso").isNull()).isTrue();
        assertThat(e1.path("usuario").isNull()).isTrue();
        assertThat(cookieRefresh(etapa1)).as("sem sessão antes do código").isNull();
        assertThat(e1.path("emailMascarado").asString()).isEqualTo("u*****@t*****.local");
        Instant expira = Instant.parse(e1.path("codigoExpiraEm").asString());
        assertThat(expira).isCloseTo(antes.plusSeconds(600), within(15, ChronoUnit.SECONDS));
        Instant reenvio = Instant.parse(e1.path("reenvioDisponivelEm").asString());
        assertThat(reenvio).isCloseTo(antes.plusSeconds(60), within(15, ChronoUnit.SECONDS));
        assertThat(e1.toString()).as("o código nunca volta na resposta").doesNotContain(caixa.ultimoCodigoPara(u.email()));

        Recebido email = caixa.ultimoPara(u.email()).orElseThrow();
        assertThat(email.codigo()).matches("\\d{6}");
        assertThat(email.html()).contains(email.codigo(), "10 minutos", "Bruno", "troque sua senha");
        assertThat(email.texto()).contains("10 minutos", "troque sua senha");
        assertThat(email.assunto()).doesNotContain(email.codigo());

        MvcTestResult etapa2 = verificarCodigo(e1.path("desafioDoisFatores").asString(), " " + email.codigo() + " ");
        assertThat(status(etapa2)).isEqualTo(200);
        JsonNode e2 = corpo(etapa2);
        assertThat(e2.path("tokenAcesso").asString()).isNotBlank();
        assertThat(e2.path("usuario").path("email").asString()).isEqualTo(u.email());
        assertThat(cookieRefresh(etapa2)).isNotBlank();
        assertThat(status(get("/api/auth/eu", e2.path("tokenAcesso").asString()))).isEqualTo(200);
    }

    @Test
    void validacaoRecusada() {
        MvcTestResult semNada = post("/api/auth/2fa/verificar", null, java.util.Map.of("desafio", "", "codigo", ""));
        assertThat(status(semNada)).isEqualTo(400);
        assertThat(corpo(semNada).path("erros").valueStream().map(e -> e.path("campo").asString()))
                .contains("desafio", "codigo");
        assertThat(status(post("/api/auth/2fa/reenviar", null, java.util.Map.of("desafio", "")))).isEqualTo(400);

        MvcTestResult forjado = verificarCodigo("nao.e.um.jwt", "123456");
        assertThat(status(forjado)).isEqualTo(401);
        assertThat(corpo(forjado).path("detail").asString()).isEqualTo(MSG_TEMPO);
        assertThat(corpo(forjado).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);
        assertThat(status(reenviarCodigo("nao.e.um.jwt"))).isEqualTo(422);
    }

    /** Isolamento: o desafio é do usuário (e do contratante) dele; o código de outro não serve. */
    @Test
    void isolamento_desafioDeUmUsuarioNaoServeComCodigoDeOutroContratante() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado deA = novoUsuario(a.admin());
        UsuarioCriado deB = novoUsuario(b.admin());
        String desafioA = desafio(deA.email(), SENHA_FORTE);
        String desafioB = desafio(deB.email(), SENHA_FORTE);
        String codigoA = caixa.ultimoCodigoPara(deA.email());
        String codigoB = caixa.ultimoCodigoPara(deB.email());

        if (!codigoA.equals(codigoB)) {
            MvcTestResult cruzado = verificarCodigo(desafioA, codigoB);
            assertThat(status(cruzado)).isEqualTo(401);
            assertThat(corpo(cruzado).path("detail").asString()).isEqualTo("Código inválido.");
            assertThat(corpo(cruzado).path("codigo").asString()).isEqualTo(CODIGO_INVALIDO);
        }
        // Reenviar pelo desafio de A manda para A, nunca para B.
        jdbc.update("UPDATE codigo_verificacao SET ultimo_envio_em = now() - interval '61 seconds' WHERE usuario_id = ?", deA.id());
        long deAAntes = caixa.quantosPara(deA.email());
        long deBAntes = caixa.quantosPara(deB.email());
        assertThat(status(reenviarCodigo(desafioA))).isEqualTo(200);
        assertThat(caixa.quantosPara(deA.email())).as("A recebeu o reenvio").isEqualTo(deAAntes + 1);
        assertThat(caixa.ultimoCodigoPara(deA.email())).isEqualTo(codigoA);
        assertThat(caixa.quantosPara(deB.email())).isEqualTo(deBAntes);

        MvcTestResult sessaoB = verificarCodigo(desafioB, codigoB);
        assertThat(status(sessaoB)).isEqualTo(200);
        assertThat(corpo(sessaoB).path("usuario").path("tenantId").asString()).isEqualTo(b.id().toString());
        MvcTestResult sessaoA = verificarCodigo(desafioA, codigoA);
        assertThat(status(sessaoA)).isEqualTo(200);
        assertThat(corpo(sessaoA).path("usuario").path("tenantId").asString()).isEqualTo(a.id().toString());
    }

    // ------------------------------------------------------------ regras

    @Test
    void codigoErradoDa401ECincoErrosBloqueiamAConta() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String certo = caixa.ultimoCodigoPara(u.email());
        String errado = outroCodigo(certo);

        for (int i = 0; i < 4; i++) {
            MvcTestResult r = verificarCodigo(desafio, errado);
            assertThat(status(r)).isEqualTo(401);
            assertThat(corpo(r).path("detail").asString()).isEqualTo("Código inválido.");
            assertThat(corpo(r).path("codigo").asString()).isEqualTo(CODIGO_INVALIDO);
        }
        assertThat(status(verificarCodigo(desafio, errado))).as("5º erro bloqueia").isEqualTo(401);

        MvcTestResult bloqueada = verificarCodigo(desafio, certo);
        assertThat(status(bloqueada)).as("bloqueada: nem o código certo entra").isEqualTo(401);
        assertThat(corpo(bloqueada).path("codigo").asString()).as("não revela o bloqueio").isEqualTo(CODIGO_INVALIDO);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("login também travado").isEqualTo(401);
        JsonNode ficha = corpo(get("/api/usuarios/" + u.id(), c.admin().token()));
        assertThat(Instant.parse(ficha.path("bloqueadoAte").asString())).isAfter(Instant.now());
        JsonNode falhas = corpo(get("/api/auditoria/eventos?tipos=DOIS_FATORES_FALHA&usuarioId=" + u.id(), c.admin().token()));
        assertThat(falhas.path("totalElementos").asLong()).isGreaterThanOrEqualTo(5);
    }

    @Test
    void codigoVencidoDepoisDeDezMinutosNaoEntraNemReenvia() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());

        jdbc.update("UPDATE codigo_verificacao SET expira_em = now() - interval '1 second', "
                + "ultimo_envio_em = now() - interval '601 seconds' WHERE usuario_id = ?", u.id());

        MvcTestResult r = verificarCodigo(desafio, codigo);
        assertThat(status(r)).isEqualTo(401);
        assertThat(corpo(r).path("detail").asString()).isEqualTo(MSG_TEMPO);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);
        MvcTestResult reenvio = reenviarCodigo(desafio);
        assertThat(status(reenvio)).isEqualTo(422);
        assertThat(corpo(reenvio).path("detail").asString()).isEqualTo("Entre de novo para receber outro código.");
        assertThat(corpo(get("/api/usuarios/" + u.id(), c.admin().token())).path("bloqueadoAte").isNull())
                .as("código vencido não conta como erro").isTrue();
    }

    @Test
    void codigoSoServeUmaVezELoginNovoInvalidaOAnterior() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio1 = desafio(u.email(), SENHA_FORTE);
        String codigo1 = caixa.ultimoCodigoPara(u.email());
        assertThat(status(verificarCodigo(desafio1, codigo1))).isEqualTo(200);

        MvcTestResult reuso = verificarCodigo(desafio1, codigo1);
        assertThat(status(reuso)).as("uso único").isEqualTo(401);
        assertThat(corpo(reuso).path("detail").asString()).isEqualTo(MSG_TEMPO);
        assertThat(corpo(reuso).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);

        String desafio2 = desafio(u.email(), SENHA_FORTE);
        String codigo2 = caixa.ultimoCodigoPara(u.email());
        String desafio3 = desafio(u.email(), SENHA_FORTE);
        String codigo3 = caixa.ultimoCodigoPara(u.email());
        assertThat(status(verificarCodigo(desafio2, codigo2))).as("login mais novo apagou este").isEqualTo(401);
        assertThat(status(verificarCodigo(desafio3, codigo3))).isEqualTo(200);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM codigo_verificacao WHERE usuario_id = ?", Long.class, u.id()))
                .as("só o último código do usuário fica guardado").isEqualTo(1);
    }

    @Test
    void reenvioMandaOMesmoCodigoSemEstenderAValidadeComIntervaloELimite() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        JsonNode e1 = corpo(tentarLogin(u.email(), SENHA_FORTE));
        String desafio = e1.path("desafioDoisFatores").asString();
        String codigo = caixa.ultimoCodigoPara(u.email());

        MvcTestResult cedo = reenviarCodigo(desafio);
        assertThat(status(cedo)).as("antes de 60 s").isEqualTo(429);
        assertThat(corpo(cedo).path("codigo").asString()).isEqualTo("MUITAS_REQUISICOES");
        assertThat(Long.parseLong(cedo.getResponse().getHeader("Retry-After"))).isBetween(1L, 60L);
        assertThat(caixa.quantosPara(u.email())).isEqualTo(1);

        for (int envio = 2; envio <= 5; envio++) {
            voltarUltimoEnvio(u.id());
            MvcTestResult r = reenviarCodigo(desafio);
            assertThat(status(r)).as("envio %d", envio).isEqualTo(200);
            JsonNode corpo = corpo(r);
            assertThat(Instant.parse(corpo.path("codigoExpiraEm").asString())).as("validade não muda")
                    .isEqualTo(Instant.parse(e1.path("codigoExpiraEm").asString()));
            assertThat(corpo.path("emailMascarado").asString()).isEqualTo(e1.path("emailMascarado").asString());
            assertThat(Instant.parse(corpo.path("reenvioDisponivelEm").asString())).isAfter(Instant.now().plusSeconds(50));
            assertThat(caixa.ultimoCodigoPara(u.email())).as("mesmo código").isEqualTo(codigo);
            assertThat(caixa.quantosPara(u.email())).isEqualTo(envio);
        }

        voltarUltimoEnvio(u.id());
        MvcTestResult sexto = reenviarCodigo(desafio);
        assertThat(status(sexto)).as("depois de 5 envios").isEqualTo(422);
        assertThat(corpo(sexto).path("detail").asString()).isEqualTo("Entre de novo para receber outro código.");
        assertThat(caixa.quantosPara(u.email())).isEqualTo(5);

        assertThat(status(verificarCodigo(desafio, codigo))).as("o código continua valendo").isEqualTo(200);
        JsonNode reenviados = corpo(get("/api/auditoria/eventos?tipos=CODIGO_REENVIADO&usuarioId=" + u.id(), c.admin().token()));
        assertThat(reenviados.path("totalElementos").asLong()).isEqualTo(4);
    }

    /** O Retry-After do reenvio é o que falta do intervalo, não os 60 s inteiros. */
    @Test
    void retryAfterDoReenvioCaiComOTempo() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        jdbc.update("UPDATE codigo_verificacao SET ultimo_envio_em = ultimo_envio_em - interval '30 seconds' "
                + "WHERE usuario_id = ?", u.id());

        MvcTestResult cedo = reenviarCodigo(desafio);
        assertThat(status(cedo)).isEqualTo(429);
        assertThat(Long.parseLong(cedo.getResponse().getHeader("Retry-After"))).as("60 s - 30 s").isBetween(29L, 31L);
        assertThat(corpo(cedo).path("detail").asString()).matches("Aguarde (29|30|31) segundos para pedir outro código\\.");
    }

    @Test
    void falhaNoEnvioDoEmailDa503SemAbrirSessao() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        MvcTestResult r;
        caixa.falharEnvios(true);
        try {
            r = tentarLogin(u.email(), SENHA_FORTE);
        } finally {
            caixa.falharEnvios(false);
        }
        assertThat(status(r)).isEqualTo(503);
        JsonNode c503 = corpo(r);
        assertThat(c503.path("codigo").asString()).isEqualTo("SERVICO_INDISPONIVEL");
        assertThat(c503.path("detail").asString())
                .isEqualTo("Não foi possível enviar o código agora. Tente de novo em instantes.");
        assertThat(c503.has("desafioDoisFatores")).isFalse();
        assertThat(cookieRefresh(r)).isNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM codigo_verificacao WHERE usuario_id = ?", Long.class, u.id()))
                .as("código que não saiu não fica valendo").isZero();
        JsonNode falha = corpo(get("/api/auditoria/eventos?tipos=EMAIL_FALHA_ENVIO&usuarioId=" + u.id(), c.admin().token()));
        assertThat(falha.path("totalElementos").asLong()).isEqualTo(1);

        assertThat(loginComCodigo(u.email(), SENHA_FORTE).token()).as("com o SMTP de volta, entra").isNotBlank();
    }

    /** O 503 diz "tente de novo em instantes": o envio que não saiu não conta (nem intervalo, nem máximo). */
    @Test
    void falhaNoReenvioDa503EOCodigoContinuaValendo() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());
        voltarUltimoEnvio(u.id());
        Instant envioAntes = ultimoEnvio(u.id());
        MvcTestResult r;
        caixa.falharEnvios(true);
        try {
            r = reenviarCodigo(desafio);
            assertThat(status(r)).isEqualTo(503);
            assertThat(status(reenviarCodigo(desafio))).as("2ª falha seguida também é 503, não 429").isEqualTo(503);
        } finally {
            caixa.falharEnvios(false);
        }
        assertThat(envios(u.id())).as("envios não sobe com a falha").isEqualTo(1);
        assertThat(ultimoEnvio(u.id())).as("intervalo devolvido").isEqualTo(envioAntes);

        long antes = caixa.quantosPara(u.email());
        assertThat(status(reenviarCodigo(desafio))).as("reenviar logo depois do 503 funciona").isEqualTo(200);
        assertThat(caixa.quantosPara(u.email())).isEqualTo(antes + 1);
        assertThat(envios(u.id())).isEqualTo(2);
        assertThat(status(verificarCodigo(desafio, codigo))).isEqualTo(200);
    }

    @Test
    void reenvioParaUsuarioInativadoDepoisDoLoginDa422() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        assertThat(status(patch("/api/usuarios/" + u.id() + "/inativar", c.admin().token()))).isEqualTo(204);
        voltarUltimoEnvio(u.id());
        long antes = caixa.quantosPara(u.email());

        MvcTestResult r = reenviarCodigo(desafio);
        assertThat(status(r)).isEqualTo(422);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Entre de novo para receber outro código.");
        assertThat(caixa.quantosPara(u.email())).as("inativo não recebe e-mail").isEqualTo(antes);
    }

    /**
     * A vítima recebe o e-mail "se não foi você, troque sua senha" e troca: quem
     * tinha a senha antiga e um desafio pendente não termina o login com o código.
     */
    @Test
    void trocarSenhaDerrubaOCodigoPendente() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao vitima = loginComCodigo(u.email(), SENHA_FORTE);
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());

        assertThat(status(put("/api/auth/senha", vitima.token(),
                Map.of("senhaAtual", SENHA_FORTE, "novaSenha", SENHA_FORTE_2)))).isEqualTo(204);

        MvcTestResult r = verificarCodigo(desafio, codigo);
        assertThat(status(r)).isEqualTo(401);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);
        assertThat(cookieRefresh(r)).isNull();
        voltarUltimoEnvio(u.id());
        assertThat(status(reenviarCodigo(desafio))).as("nem reenviar").isEqualTo(422);
        assertThat(loginComCodigo(u.email(), SENHA_FORTE_2).token()).as("com a senha nova entra").isNotBlank();
    }

    @Test
    void redefinirSenhaPeloAdministradorDerrubaOCodigoPendente() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());

        assertThat(status(patch("/api/usuarios/" + u.id() + "/redefinir-senha", c.admin().token(),
                Map.of("novaSenha", "Nova-Temporaria-2026")))).isEqualTo(204);

        MvcTestResult r = verificarCodigo(desafio, codigo);
        assertThat(status(r)).isEqualTo(401);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);
        assertThat(cookieRefresh(r)).isNull();
    }

    /** O desbloqueio zera o contador; o código pendente não pode ganhar mais 5 chutes. */
    @Test
    void bloqueioApagaOCodigoEODesbloqueioNaoODevolve() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String certo = caixa.ultimoCodigoPara(u.email());
        String errado = outroCodigo(certo);
        for (int i = 0; i < 5; i++) {
            assertThat(status(verificarCodigo(desafio, errado))).isEqualTo(401);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM codigo_verificacao WHERE usuario_id = ?", Long.class, u.id()))
                .as("bloqueio apaga o código").isZero();

        assertThat(status(patch("/api/usuarios/" + u.id() + "/desbloquear", c.admin().token()))).isEqualTo(204);

        MvcTestResult r = verificarCodigo(desafio, certo);
        assertThat(status(r)).as("nem o código certo de antes do bloqueio").isEqualTo(401);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo(DESAFIO_EXPIRADO);
        assertThat(loginComCodigo(u.email(), SENHA_FORTE).token()).as("login novo funciona").isNotBlank();
    }

    @Test
    void usuarioInativadoEntreASenhaEOCodigoNaoEntra() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());
        assertThat(status(patch("/api/usuarios/" + u.id() + "/inativar", c.admin().token()))).isEqualTo(204);

        MvcTestResult r = verificarCodigo(desafio, codigo);
        assertThat(status(r)).isEqualTo(401);
        assertThat(corpo(r).path("codigo").asString()).as("não revela a inativação").isEqualTo(CODIGO_INVALIDO);
        assertThat(cookieRefresh(r)).isNull();
    }

    @Test
    void contratanteInativadoEntreASenhaEOCodigoNaoAbreSessao() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String desafio = desafio(u.email(), SENHA_FORTE);
        String codigo = caixa.ultimoCodigoPara(u.email());
        assertThat(status(patch("/api/tenants/" + c.id() + "/inativar", loginSuperadmin().token()))).isEqualTo(204);

        MvcTestResult r = verificarCodigo(desafio, codigo);
        assertThat(status(r)).isEqualTo(401);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo(CODIGO_INVALIDO);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Código inválido.");
        assertThat(cookieRefresh(r)).isNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM evento_seguranca WHERE usuario_id = ? AND tipo = 'LOGIN_SUCESSO'",
                Long.class, u.id())).as("nenhum login registrado").isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sessao_usuario WHERE usuario_id = ?", Long.class, u.id()))
                .as("nenhuma sessão aberta").isZero();
    }

    @Test
    void limpezaDiariaApagaCodigosVencidosEUsadosEMantemOsValendo() {
        Contratante c = novoContratante();
        UsuarioCriado vencido = novoUsuario(c.admin());
        UsuarioCriado usado = novoUsuario(c.admin());
        UsuarioCriado valendo = novoUsuario(c.admin());
        desafio(vencido.email(), SENHA_FORTE);
        loginComCodigo(usado.email(), SENHA_FORTE);
        desafio(valendo.email(), SENHA_FORTE);
        jdbc.update("UPDATE codigo_verificacao SET expira_em = now() - interval '1 second' WHERE usuario_id = ?", vencido.id());

        codigoVerificacaoService.limparVencidos();

        assertThat(codigosDo(vencido.id())).as("vencido").isZero();
        assertThat(codigosDo(usado.id())).as("usado").isZero();
        assertThat(codigosDo(valendo.id())).as("ainda vale").isEqualTo(1);
    }

    // ------------------------------------------------------------ apoio

    private long codigosDo(UUID usuarioId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM codigo_verificacao WHERE usuario_id = ?", Long.class, usuarioId);
    }

    /** Simula que o último envio foi há mais de 60 s (o intervalo mínimo do reenvio). */
    private void voltarUltimoEnvio(UUID usuarioId) {
        jdbc.update("UPDATE codigo_verificacao SET ultimo_envio_em = ultimo_envio_em - interval '61 seconds' "
                + "WHERE usuario_id = ?", usuarioId);
    }

    private int envios(UUID usuarioId) {
        return jdbc.queryForObject("SELECT envios FROM codigo_verificacao WHERE usuario_id = ?", Integer.class, usuarioId);
    }

    private Instant ultimoEnvio(UUID usuarioId) {
        return jdbc.queryForObject("SELECT ultimo_envio_em FROM codigo_verificacao WHERE usuario_id = ?",
                java.sql.Timestamp.class, usuarioId).toInstant();
    }

    private static String outroCodigo(String certo) {
        char ultimo = certo.charAt(5);
        return certo.substring(0, 5) + (ultimo == '9' ? '0' : (char) (ultimo + 1));
    }
}
