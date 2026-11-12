package com.api.ero_api.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * MÓDULO-MODELO de testes. Todo módulo novo tem, no mínimo:
 * caminho feliz, validação recusada, isolamento entre tenants e o par LER/ESCREVER.
 */
class UsuarioIntegracaoTest extends IntegracaoTest {

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_criaListaBuscaAlteraInativa() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String email = unico("marina") + "@teste.local";

        MvcTestResult criado = post("/api/usuarios", token,
                Map.of("nome", "Marina Souza", "email", email.toUpperCase(), "senha", SENHA_FORTE, "papel", "USUARIO"));
        assertThat(status(criado)).isEqualTo(201);
        JsonNode u = corpo(criado);
        String id = u.path("id").asString();
        assertThat(u.path("email").asString()).as("e-mail normalizado").isEqualTo(email);
        assertThat(u.path("exigirTrocaSenha").asBoolean()).isTrue();
        assertThat(u.has("senhaHash")).isFalse();
        assertThat(u.path("createdBy").asString()).isNotBlank();
        long versaoCriada = u.path("version").asLong();

        JsonNode lista = corpo(get("/api/usuarios?busca=marina", token));
        assertThat(lista.path("totalElementos").asLong()).isEqualTo(1);

        MvcTestResult alterado = put("/api/usuarios/" + id, token, Map.of(
                "nome", "Marina S. Prado", "email", email, "papel", "USUARIO", "version", versaoCriada));
        assertThat(status(alterado)).isEqualTo(200);
        JsonNode a = corpo(alterado);
        assertThat(a.path("nome").asString()).isEqualTo("Marina S. Prado");
        assertThat(a.path("version").asLong()).as("resposta já traz a versão nova").isEqualTo(versaoCriada + 1);
        assertThat(a.path("updatedBy").asString()).isNotBlank();

        // A versão devolvida serve para salvar de novo sem 409 falso.
        assertThat(status(put("/api/usuarios/" + id, token, Map.of(
                "nome", "Marina Prado", "email", email, "papel", "USUARIO", "version", a.path("version").asLong()))))
                .isEqualTo(200);

        assertThat(status(patch("/api/usuarios/" + id + "/inativar", token))).isEqualTo(204);
        assertThat(corpo(get("/api/usuarios/" + id, token)).path("ativo").asBoolean()).isFalse();
        assertThat(status(tentarLogin(email, SENHA_FORTE))).as("inativo não entra").isEqualTo(401);
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        MvcTestResult r = post("/api/usuarios", c.admin().token(),
                Map.of("nome", "", "email", "nao-e-email", "senha", "curta", "papel", "USUARIO"));
        assertThat(status(r)).isEqualTo(400);
        List<String> campos = corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
        assertThat(campos).contains("nome", "email");

        MvcTestResult senhaFraca = post("/api/usuarios", c.admin().token(), Map.of(
                "nome", "Carlos Dias", "email", unico("carlos") + "@teste.local", "senha", "senha123456789", "papel", "USUARIO"));
        assertThat(status(senhaFraca)).isEqualTo(422);
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado deA = novoUsuario(a.admin());
        String tokenB = b.admin().token();

        assertThat(status(get("/api/usuarios/" + deA.id(), tokenB))).isEqualTo(404);
        assertThat(status(put("/api/usuarios/" + deA.id(), tokenB,
                Map.of("nome", "Invasor", "email", deA.email(), "papel", "USUARIO", "version", 0)))).isEqualTo(404);
        assertThat(status(patch("/api/usuarios/" + deA.id() + "/inativar", tokenB))).isEqualTo(404);
        assertThat(status(patch("/api/usuarios/" + deA.id() + "/redefinir-senha", tokenB,
                Map.of("novaSenha", SENHA_FORTE_2)))).isEqualTo(404);
        assertThat(status(get("/api/permissoes/usuarios/" + deA.id(), tokenB))).isEqualTo(404);
        assertThat(status(put("/api/permissoes/usuarios/" + deA.id(), tokenB,
                Map.of("liberacoes", List.of(), "acoes", Set.of(), "version", 0)))).isEqualTo(404);

        // Nada mudou do lado de A.
        JsonNode visto = corpo(get("/api/usuarios/" + deA.id(), a.admin().token()));
        assertThat(visto.path("nome").asString()).isEqualTo("Bruno Rocha");
        assertThat(visto.path("ativo").asBoolean()).isTrue();

        JsonNode listaB = corpo(get("/api/usuarios?size=100", tokenB));
        List<String> emails = listaB.path("conteudo").valueStream().map(n -> n.path("email").asString()).toList();
        assertThat(emails).doesNotContain(deA.email()).contains(b.adminEmail());

        JsonNode selecaoB = corpo(get("/api/usuarios/selecao", tokenB));
        assertThat(selecaoB.valueStream().map(n -> n.path("id").asString())).doesNotContain(deA.id().toString());
    }

    @Test
    void parLerEscrever() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get("/api/usuarios", comum.token()))).as("sem liberação").isEqualTo(403);

        liberar(c.admin().token(), u.id(), List.of(grupo("USUARIOS", "LER")), Set.of());
        assertThat(status(get("/api/usuarios", comum.token()))).isEqualTo(200);
        assertThat(status(post("/api/usuarios", comum.token(), novoUsuarioBody("USUARIO")))).isEqualTo(403);

        liberar(c.admin().token(), u.id(), List.of(grupo("USUARIOS", "ESCREVER")), Set.of());
        assertThat(status(post("/api/usuarios", comum.token(), novoUsuarioBody("USUARIO")))).isEqualTo(201);

        // Mas não cria administrador (escalada de privilégio).
        assertThat(status(post("/api/usuarios", comum.token(), novoUsuarioBody("ADMIN")))).isEqualTo(403);
    }

    // ------------------------------------------------------------ regras

    @Test
    void usuarioComumNaoTomaAContaDeColegaComMaisAcesso() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        UsuarioCriado atacante = novoUsuario(c.admin());
        UsuarioCriado poderoso = novoUsuario(c.admin());
        UsuarioCriado simples = novoUsuario(c.admin());
        liberar(admin, atacante.id(), List.of(grupo("USUARIOS", "ESCREVER")), Set.of());
        liberar(admin, poderoso.id(), List.of(grupo("USUARIOS", "ESCREVER"), grupo("AUDITORIA", "LER")),
                Set.of("USUARIOS_LIBERAR_ACESSO"));
        Sessao a = loginTrocandoSenha(atacante.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(patch("/api/usuarios/" + poderoso.id() + "/redefinir-senha", a.token(),
                Map.of("novaSenha", "Senha-Do-Atacante-99")))).as("redefinir senha").isEqualTo(403);
        assertThat(status(patch("/api/usuarios/" + simples.id() + "/redefinir-senha", a.token(),
                Map.of("novaSenha", "Senha-Do-Atacante-99")))).as("nem de colega simples").isEqualTo(403);

        long versaoSimples0 = corpo(get("/api/usuarios/" + simples.id(), a.token())).path("version").asLong();
        assertThat(status(put("/api/usuarios/" + simples.id(), a.token(), Map.of(
                "nome", "Bruno Rocha", "email", unico("atacante") + "@teste.local", "papel", "USUARIO", "version", versaoSimples0))))
                .as("trocar o e-mail de login de um colega, mesmo com acesso menor").isEqualTo(403);
        assertThat(status(patch("/api/usuarios/" + simples.id() + "/desbloquear", a.token())))
                .as("desbloquear colega").isEqualTo(403);
        assertThat(status(patch("/api/usuarios/" + poderoso.id() + "/inativar", a.token())))
                .as("colega com mais acesso").isEqualTo(403);

        long versaoSimples = corpo(get("/api/usuarios/" + simples.id(), a.token())).path("version").asLong();
        assertThat(status(put("/api/usuarios/" + simples.id(), a.token(), Map.of(
                "nome", "Nome Corrigido", "email", simples.email(), "papel", "USUARIO", "version", versaoSimples))))
                .as("colega com acesso menor ou igual").isEqualTo(200);
    }

    @Test
    void ninguemAlteraAsPropriasPermissoesNemConcedeOQueNaoTem() {
        Contratante c = novoContratante();
        UsuarioCriado gerente = novoUsuario(c.admin());
        UsuarioCriado outro = novoUsuario(c.admin());
        liberar(c.admin().token(), gerente.id(), List.of(grupo("USUARIOS", "LER")), Set.of("USUARIOS_LIBERAR_ACESSO"));
        Sessao g = loginTrocandoSenha(gerente.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(put("/api/permissoes/usuarios/" + gerente.id(), g.token(), Map.of(
                "liberacoes", List.of(grupo("USUARIOS", "ESCREVER")), "acoes", Set.of(), "version", 99))))
                .isEqualTo(403);

        UsuarioCriado poderoso = novoUsuario(c.admin());
        liberar(c.admin().token(), poderoso.id(), List.of(grupo("USUARIOS", "ESCREVER"), grupo("AUDITORIA", "LER")), Set.of());
        long versaoPoderoso = corpo(get("/api/permissoes/usuarios/" + poderoso.id(), g.token())).path("version").asLong();
        assertThat(status(put("/api/permissoes/usuarios/" + poderoso.id(), g.token(), Map.of(
                "liberacoes", List.of(), "acoes", Set.of(), "version", versaoPoderoso))))
                .as("não tira acesso de quem tem mais que ele").isEqualTo(403);
        assertThat(corpo(get("/api/permissoes/usuarios/" + poderoso.id(), c.admin().token())).path("liberacoes").size())
                .isEqualTo(2);

        long versao = corpo(get("/api/permissoes/usuarios/" + outro.id(), g.token())).path("version").asLong();
        assertThat(status(put("/api/permissoes/usuarios/" + outro.id(), g.token(), Map.of(
                "liberacoes", List.of(grupo("AUDITORIA", "LER")), "acoes", Set.of(), "version", versao))))
                .as("gerente não tem AUDITORIA").isEqualTo(403);
        assertThat(status(put("/api/permissoes/usuarios/" + outro.id(), g.token(), Map.of(
                "liberacoes", List.of(grupo("USUARIOS", "LER")), "acoes", Set.of(), "version", versao))))
                .isEqualTo(200);
    }

    @Test
    void permissoesRecusamListaInvalidaEVersaoAntiga() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String token = c.admin().token();
        long versao = corpo(get("/api/permissoes/usuarios/" + u.id(), token)).path("version").asLong();

        assertThat(status(put("/api/permissoes/usuarios/" + u.id(), token, Map.of(
                "liberacoes", List.of(grupo("USUARIOS", "LER"), grupo("USUARIOS", "ESCREVER")),
                "acoes", Set.of(), "version", versao)))).as("grupo repetido").isEqualTo(422);
        assertThat(status(put("/api/permissoes/usuarios/" + u.id(), token, Map.of(
                "liberacoes", List.of(), "acoes", Set.of("USUARIOS_LIBERAR_ACESSO"), "version", versao))))
                .as("ação sem o grupo").isEqualTo(422);

        MvcTestResult ok = put("/api/permissoes/usuarios/" + u.id(), token, Map.of(
                "liberacoes", List.of(grupo("USUARIOS", "LER")), "acoes", Set.of(), "version", versao));
        assertThat(status(ok)).isEqualTo(200);
        assertThat(corpo(ok).path("version").asLong()).isEqualTo(versao + 1);
        assertThat(status(put("/api/permissoes/usuarios/" + u.id(), token, Map.of(
                "liberacoes", List.of(grupo("AUDITORIA", "LER")), "acoes", Set.of(), "version", versao))))
                .as("outra tela aberta com a versão antiga").isEqualTo(409);
    }

    @Test
    void naoAlteraOProprioPapelEUsuarioComumNaoAlteraAdmin() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        String adminId = c.admin().corpo().path("usuario").path("id").asString();
        long versao = corpo(get("/api/usuarios/" + adminId, admin)).path("version").asLong();
        assertThat(status(put("/api/usuarios/" + adminId, admin, Map.of(
                "nome", "Ana Lima", "email", c.adminEmail(), "papel", "USUARIO", "version", versao)))).isEqualTo(403);

        UsuarioCriado u = novoUsuario(c.admin());
        liberar(admin, u.id(), List.of(grupo("USUARIOS", "ESCREVER")), Set.of());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        assertThat(status(patch("/api/usuarios/" + adminId + "/inativar", comum.token()))).isEqualTo(403);
    }

    @Test
    void redefinirSenhaDerrubaAsSessoesEExigeTroca() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        assertThat(status(get("/api/auth/eu", s.token()))).isEqualTo(200);

        assertThat(status(patch("/api/usuarios/" + u.id() + "/redefinir-senha", c.admin().token(),
                Map.of("novaSenha", "Nova-Temporaria-2026")))).isEqualTo(204);

        assertThat(status(get("/api/auth/eu", s.token()))).as("sessão antiga caiu").isEqualTo(401);
        Sessao nova = loginComCodigo(u.email(), "Nova-Temporaria-2026");
        assertThat(nova.corpo().path("usuario").path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
    }

    @Test
    void desbloquearSoPorAdministradorENuncaEmSiMesmo() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        String adminId = c.admin().corpo().path("usuario").path("id").asString();
        assertThat(status(patch("/api/usuarios/" + adminId + "/desbloquear", admin))).isEqualTo(403);
        assertThat(status(patch("/api/usuarios/" + adminId + "/ativar", admin))).as("reativar a si mesmo").isEqualTo(403);

        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        liberar(admin, u.id(), List.of(grupo("USUARIOS", "ESCREVER")), Set.of());
        for (int i = 0; i < 4; i++) {
            put("/api/auth/senha", s.token(), Map.of("senhaAtual", "Chute-Errado-" + i + "-xyz", "novaSenha", "Qualquer-Nova-2026"));
        }
        // "ativar" a si mesmo não zera mais o contador: o 5º chute bloqueia.
        assertThat(status(patch("/api/usuarios/" + u.id() + "/ativar", s.token()))).isEqualTo(403);
        put("/api/auth/senha", s.token(), Map.of("senhaAtual", "Chute-Errado-9-xyz", "novaSenha", "Qualquer-Nova-2026"));
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE_2))).as("bloqueada").isEqualTo(401);
    }

    @Test
    void desbloquearEAtivarDeOutroContratanteDa404() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado deA = novoUsuario(a.admin());
        assertThat(status(patch("/api/usuarios/" + deA.id() + "/desbloquear", b.admin().token()))).isEqualTo(404);
        assertThat(status(patch("/api/usuarios/" + deA.id() + "/ativar", b.admin().token()))).isEqualTo(404);
    }

    // ------------------------------------------------------------ limite de usuários do contratante

    @Test
    void limite_adminCriaAteOLimiteEInativarLiberaVaga() {
        Contratante c = novoContratante(3);
        String admin = c.admin().token();
        UsuarioCriado primeiro = novoUsuario(c.admin());
        novoUsuario(c.admin());

        MvcTestResult cheio = post("/api/usuarios", admin, novoUsuarioBody("USUARIO"));
        assertThat(status(cheio)).as("admin inicial + 2 = 3 de 3").isEqualTo(422);
        assertThat(corpo(cheio).path("detail").asString())
                .isEqualTo("Este contratante já usa 3 de 3 usuários. Fale com o suporte para ampliar.");

        assertThat(status(patch("/api/usuarios/" + primeiro.id() + "/inativar", admin))).isEqualTo(204);
        assertThat(status(post("/api/usuarios", admin, novoUsuarioBody("ADMIN")))).as("vaga liberada").isEqualTo(201);
        assertThat(status(post("/api/usuarios", admin, novoUsuarioBody("USUARIO")))).isEqualTo(422);
    }

    @Test
    void limite_reativarExigeVaga() {
        Contratante c = novoContratante(2);
        String admin = c.admin().token();
        UsuarioCriado u = novoUsuario(c.admin());
        assertThat(status(patch("/api/usuarios/" + u.id() + "/inativar", admin))).isEqualTo(204);
        UsuarioCriado outro = novoUsuario(c.admin());

        MvcTestResult reativar = patch("/api/usuarios/" + u.id() + "/ativar", admin);
        assertThat(status(reativar)).isEqualTo(422);
        assertThat(corpo(reativar).path("detail").asString())
                .isEqualTo("Este contratante já usa 2 de 2 usuários. Fale com o suporte para ampliar.");
        assertThat(corpo(get("/api/usuarios/" + u.id(), admin)).path("ativo").asBoolean()).isFalse();
        assertThat(status(patch("/api/usuarios/" + outro.id() + "/ativar", admin)))
                .as("quem já está ativo não ocupa outra vaga").isEqualTo(204);

        assertThat(status(patch("/api/usuarios/" + outro.id() + "/inativar", admin))).isEqualTo(204);
        assertThat(status(patch("/api/usuarios/" + u.id() + "/ativar", admin))).isEqualTo(204);
    }

    /**
     * Duplo clique em "Ativar" com a última vaga: o segundo pedido espera o primeiro
     * (linha do usuário travada), já o lê ativo e responde 204 sem pedir outra vaga.
     */
    @Test
    void limite_duploCliqueEmAtivarNaUltimaVagaDaDuasVezes204() throws Exception {
        Contratante c = novoContratante(2);
        String admin = c.admin().token();
        UsuarioCriado u = novoUsuario(c.admin());
        for (int rodada = 0; rodada < 5; rodada++) {
            assertThat(status(patch("/api/usuarios/" + u.id() + "/inativar", admin))).isEqualTo(204);
            java.util.concurrent.CyclicBarrier largada = new java.util.concurrent.CyclicBarrier(2);
            java.util.concurrent.Callable<Integer> clique = () -> {
                largada.await();
                return status(patch("/api/usuarios/" + u.id() + "/ativar", admin));
            };
            try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
                var primeiro = pool.submit(clique);
                var segundo = pool.submit(clique);
                assertThat(List.of(primeiro.get(), segundo.get())).as("rodada %d", rodada).containsOnly(204);
            }
            assertThat(corpo(get("/api/usuarios/" + u.id(), admin)).path("ativo").asBoolean()).isTrue();
        }
    }

    @Test
    void limite_reduzidoAbaixoDoUsoEAceitoESoTravaCriarEReativar() {
        Contratante c = novoContratante(3);
        String admin = c.admin().token();
        UsuarioCriado u1 = novoUsuario(c.admin());
        UsuarioCriado u2 = novoUsuario(c.admin());
        Sessao s = loginSuperadmin();
        JsonNode t = corpo(get("/api/tenants/" + c.id(), s.token()));
        MvcTestResult reduzido = put("/api/tenants/" + c.id(), s.token(), Map.of(
                "nome", t.path("nome").asString(), "limiteUsuarios", 1, "version", t.path("version").asLong()));
        assertThat(status(reduzido)).isEqualTo(200);
        assertThat(corpo(reduzido).path("usuariosAtivos").asLong()).isEqualTo(3);

        assertThat(status(get("/api/usuarios", admin))).as("ninguém é desligado").isEqualTo(200);
        assertThat(loginComCodigo(u1.email(), SENHA_FORTE).token()).as("quem já existe continua entrando").isNotBlank();
        MvcTestResult criar = post("/api/usuarios", admin, novoUsuarioBody("USUARIO"));
        assertThat(status(criar)).isEqualTo(422);
        assertThat(corpo(criar).path("detail").asString())
                .isEqualTo("Este contratante já usa 3 de 1 usuários. Fale com o suporte para ampliar.");

        assertThat(status(patch("/api/usuarios/" + u2.id() + "/inativar", admin))).isEqualTo(204);
        assertThat(status(patch("/api/usuarios/" + u2.id() + "/ativar", admin))).as("2 de 1").isEqualTo(422);
    }

    @Test
    void limite_isolamentoEntreContratantes() {
        Contratante cheio = novoContratante(1);
        Contratante folgado = novoContratante(5);
        novoUsuario(folgado.admin());
        novoUsuario(folgado.admin());

        assertThat(status(post("/api/usuarios", cheio.admin().token(), novoUsuarioBody("USUARIO"))))
                .as("os usuários do outro contratante não contam aqui, mas o admin inicial sim").isEqualTo(422);
        assertThat(corpo(post("/api/usuarios", cheio.admin().token(), novoUsuarioBody("USUARIO"))).path("detail").asString())
                .contains("1 de 1");
        assertThat(status(post("/api/usuarios", folgado.admin().token(), novoUsuarioBody("USUARIO")))).isEqualTo(201);

        // Superadmin atuando dentro do contratante cheio também respeita o limite dele.
        Sessao s = loginSuperadmin();
        String dentro = corpo(post("/api/auth/superadmin/acessar/" + cheio.id(), s.token(), Map.of()))
                .path("tokenAcesso").asString();
        assertThat(status(post("/api/usuarios", dentro, novoUsuarioBody("USUARIO")))).isEqualTo(422);
    }

    @Test
    void desbloqueioPeloAdminELoginNaoMudaAVersao() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String admin = c.admin().token();
        long versao = corpo(get("/api/usuarios/" + u.id(), admin)).path("version").asLong();

        loginComCodigo(u.email(), SENHA_FORTE);
        tentarLogin(u.email(), "Senha-Errada-Total-1");
        assertThat(corpo(get("/api/usuarios/" + u.id(), admin)).path("version").asLong())
                .as("login e erro de senha não mexem na versão do cadastro").isEqualTo(versao);

        for (int i = 0; i < 5; i++) {
            tentarLogin(u.email(), "Senha-Errada-Total-" + i);
        }
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("bloqueada").isEqualTo(401);
        assertThat(status(patch("/api/usuarios/" + u.id() + "/ativar", admin))).isEqualTo(204);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("ativar não desbloqueia").isEqualTo(401);
        assertThat(status(patch("/api/usuarios/" + u.id() + "/desbloquear", admin))).isEqualTo(204);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("desbloqueada pelo admin").isEqualTo(200);
    }

    @Test
    void bloqueadoAteApareceNaFichaESomeAoDesbloquear() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String admin = c.admin().token();
        assertThat(corpo(get("/api/usuarios/" + u.id(), admin)).path("bloqueadoAte").isNull()).isTrue();

        for (int i = 0; i < 5; i++) {
            tentarLogin(u.email(), "Senha-Errada-Total-" + i);
        }
        JsonNode bloqueado = corpo(get("/api/usuarios/" + u.id(), admin));
        assertThat(java.time.Instant.parse(bloqueado.path("bloqueadoAte").asString())).isAfter(java.time.Instant.now());
        JsonNode naLista = corpo(get("/api/usuarios?busca=" + u.email(), admin)).path("conteudo").get(0);
        assertThat(naLista.path("bloqueadoAte").isNull()).as("lista também traz").isFalse();

        assertThat(status(patch("/api/usuarios/" + u.id() + "/desbloquear", admin))).isEqualTo(204);
        assertThat(corpo(get("/api/usuarios/" + u.id(), admin)).path("bloqueadoAte").isNull()).isTrue();
    }

    @Test
    void edicaoComVersaoAntigaDaConflito() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String token = c.admin().token();
        long versao = corpo(get("/api/usuarios/" + u.id(), token)).path("version").asLong();

        assertThat(status(put("/api/usuarios/" + u.id(), token,
                Map.of("nome", "Primeira Edicao", "email", u.email(), "papel", "USUARIO", "version", versao)))).isEqualTo(200);
        assertThat(status(put("/api/usuarios/" + u.id(), token,
                Map.of("nome", "Segunda Edicao", "email", u.email(), "papel", "USUARIO", "version", versao)))).isEqualTo(409);
    }

    @Test
    void emailDuplicadoEmOutroContratanteTambemERecusado() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado u = novoUsuario(a.admin());
        MvcTestResult r = post("/api/usuarios", b.admin().token(),
                Map.of("nome", "Outro Nome", "email", u.email(), "senha", SENHA_FORTE, "papel", "USUARIO"));
        assertThat(status(r)).isEqualTo(409);
    }

    @Test
    void ordenacaoSoPorCampoPermitido() {
        Contratante c = novoContratante();
        assertThat(status(get("/api/usuarios?sort=senhaHash", c.admin().token()))).isEqualTo(422);
        assertThat(status(get("/api/usuarios?sort=nome,desc", c.admin().token()))).isEqualTo(200);
    }

    private static Map<String, String> novoUsuarioBody(String papel) {
        return Map.of("nome", "Novo Nome", "email", unico("x") + "@teste.local", "senha", SENHA_FORTE, "papel", papel);
    }
}
