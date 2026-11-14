package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Tema claro/escuro escolhido por cada usuário ({@code PUT /api/auth/eu/tema}). É
 * preferência pessoal: sem grupo de liberação, sem evento de segurança e sem mexer
 * na {@code version} do cadastro. {@code null} = segue o tema padrão do contratante.
 */
class TemaPreferidoIntegracaoTest extends IntegracaoTest {

    private static final String ROTA = "/api/auth/eu/tema";

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_trocaParaClaroApareceNoEuValeEmOutraSessaoEVoltaANull() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        assertThat(c.admin().corpo().path("usuario").has("temaPreferido")).as("vem no 2FA").isTrue();
        assertThat(c.admin().corpo().path("usuario").path("temaPreferido").isNull()).as("todo usuário nasce seguindo o contratante").isTrue();

        assertThat(status(put(ROTA, token, Map.of("tema", "CLARO")))).isEqualTo(204);

        JsonNode eu = corpo(get("/api/auth/eu", token));
        assertThat(eu.path("temaPreferido").asString()).isEqualTo("CLARO");
        assertThat(eu.path("aparencia").path("temaPadrao").asString()).as("o padrão do contratante não muda").isEqualTo("ESCURO");

        // Outro computador: login novo já traz a escolha. O refresh também.
        Sessao outra = loginComCodigo(c.adminEmail(), SENHA_FORTE_2);
        assertThat(outra.corpo().path("usuario").path("temaPreferido").asString()).isEqualTo("CLARO");
        assertThat(corpo(refresh(outra.refresh())).path("usuario").path("temaPreferido").asString()).isEqualTo("CLARO");

        assertThat(status(put(ROTA, token, Collections.singletonMap("tema", null)))).isEqualTo(204);
        assertThat(corpo(get("/api/auth/eu", token)).path("temaPreferido").isNull()).as("volta a seguir o contratante").isTrue();
    }

    @Test
    void validacaoRecusada_valorForaDoEnumOuSemCorpoDa400ENaoMuda() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        assertThat(status(put(ROTA, token, Map.of("tema", "ESCURO")))).isEqualTo(204);

        MvcTestResult azul = put(ROTA, token, Map.of("tema", "AZUL"));
        assertThat(status(azul)).isEqualTo(400);
        assertThat(corpo(azul).path("codigo").asString()).isEqualTo("REQUISICAO_INVALIDA");
        assertThat(status(put(ROTA, token, Map.of("tema", "claro")))).as("só o nome exato").isEqualTo(400);
        assertThat(status(put(ROTA, token, Map.of("tema", 1)))).as("número não vira tema").isEqualTo(400);
        assertThat(status(put(ROTA, token, Map.of("tema", Map.of("valor", "CLARO"))))).isEqualTo(400);
        MvcTestResult semCorpo = mvc.put().uri(ROTA).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).exchange();
        assertThat(status(semCorpo)).isEqualTo(400);

        assertThat(corpo(get("/api/auth/eu", token)).path("temaPreferido").asString()).as("nada mudou").isEqualTo("ESCURO");
    }

    @Test
    void isolamento_cadaUmSoMudaOProprioENadaVazaEntreContratantes() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado colega = novoUsuario(a.admin());
        Sessao sessaoColega = loginTrocandoSenha(colega.email(), SENHA_FORTE, SENHA_FORTE_2);

        // O corpo não escolhe de quem é o tema: id de outro usuário é ignorado.
        assertThat(status(put(ROTA, a.admin().token(), Map.of("tema", "CLARO", "usuarioId", colega.id().toString(),
                "id", colega.id().toString())))).isEqualTo(204);

        assertThat(corpo(get("/api/auth/eu", a.admin().token())).path("temaPreferido").asString()).isEqualTo("CLARO");
        assertThat(corpo(get("/api/auth/eu", sessaoColega.token())).path("temaPreferido").isNull())
                .as("colega do mesmo contratante não muda").isTrue();
        assertThat(corpo(get("/api/auth/eu", b.admin().token())).path("temaPreferido").isNull())
                .as("outro contratante não muda").isTrue();

        // Não existe rota para o tema de outra pessoa, e a ficha do usuário não expõe a preferência.
        assertThat(status(put("/api/usuarios/" + colega.id() + "/tema", a.admin().token(), Map.of("tema", "CLARO"))))
                .isBetween(400, 499);
        assertThat(status(put("/api/auth/eu/tema/" + colega.id(), a.admin().token(), Map.of("tema", "CLARO"))))
                .isBetween(400, 499);
        assertThat(corpo(get("/api/auth/eu", sessaoColega.token())).path("temaPreferido").isNull()).isTrue();
        JsonNode ficha = corpo(get("/api/usuarios/" + colega.id(), a.admin().token()));
        assertThat(ficha.has("temaPreferido")).as("preferência de outro usuário não sai").isFalse();
        JsonNode lista = corpo(get("/api/usuarios", a.admin().token()));
        assertThat(lista.path("conteudo").get(0).has("temaPreferido")).isFalse();
    }

    /** Par de acesso: não há grupo de liberação (preferência pessoal). Sem token é 401; qualquer logado pode. */
    @Test
    void parAcesso_semTokenDa401EQualquerLogadoMesmoSemPermissaoTrocaOProprio() {
        assertThat(status(put(ROTA, null, Map.of("tema", "CLARO")))).isEqualTo(401);
        assertThat(status(put(ROTA, "token.falso.aqui", Map.of("tema", "CLARO")))).isEqualTo(401);

        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        // Usuário comum sem nenhuma liberação e ainda com a senha temporária (pendência).
        Sessao pendente = loginComCodigo(u.email(), SENHA_FORTE);
        assertThat(pendente.corpo().path("usuario").path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
        assertThat(status(put(ROTA, pendente.token(), Map.of("tema", "CLARO")))).isEqualTo(204);
        assertThat(corpo(get("/api/auth/eu", pendente.token())).path("temaPreferido").asString()).isEqualTo("CLARO");
    }

    // ------------------------------------------------------------ regras

    @Test
    void trocaDeTemaNaoMudaAVersionNemOAlteradoPorEOPutDoAdminLogoDepoisPassa() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        JsonNode antes = corpo(get("/api/usuarios/" + u.id(), c.admin().token()));

        assertThat(status(put(ROTA, s.token(), Map.of("tema", "CLARO")))).isEqualTo(204);

        JsonNode depois = corpo(get("/api/usuarios/" + u.id(), c.admin().token()));
        assertThat(depois.path("version").asLong()).isEqualTo(antes.path("version").asLong());
        assertThat(depois.path("updatedAt").asString()).isEqualTo(antes.path("updatedAt").asString());
        assertThat(depois.path("alteradoPorNome").asString()).isEqualTo(antes.path("alteradoPorNome").asString());

        // O admin estava com a ficha aberta (version de antes da troca): salva sem 409.
        MvcTestResult salvar = put("/api/usuarios/" + u.id(), c.admin().token(), Map.of(
                "nome", "Bruno R. Rocha", "email", u.email(), "papel", "USUARIO", "version", antes.path("version").asLong()));
        assertThat(status(salvar)).isEqualTo(200);
        assertThat(corpo(get("/api/auth/eu", s.token())).path("temaPreferido").asString())
                .as("salvar o cadastro não apaga a preferência").isEqualTo("CLARO");
    }

    @Test
    void trocaDeTemaNaoGravaEventoDeSeguranca() {
        Contratante c = novoContratante();
        UUID adminId = UUID.fromString(c.admin().corpo().path("usuario").path("id").asString());
        String eventos = "/api/auditoria/eventos?usuarioId=" + adminId;
        long antes = corpo(get(eventos, c.admin().token())).path("totalElementos").asLong();

        assertThat(status(put(ROTA, c.admin().token(), Map.of("tema", "CLARO")))).isEqualTo(204);
        assertThat(status(put(ROTA, c.admin().token(), Collections.singletonMap("tema", null)))).isEqualTo(204);

        assertThat(corpo(get(eventos, c.admin().token())).path("totalElementos").asLong()).isEqualTo(antes);
    }

    @Test
    void superadminTemAPropriaEscolhaNaPlataformaEDentroDoContratante() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        try {
            assertThat(status(put(ROTA, s.token(), Map.of("tema", "CLARO")))).isEqualTo(204);
            assertThat(corpo(get("/api/auth/eu", s.token())).path("temaPreferido").asString()).isEqualTo("CLARO");

            JsonNode dentro = corpo(post("/api/auth/superadmin/acessar/" + c.id(), s.token(), Map.of()));
            assertThat(dentro.path("usuario").path("temaPreferido").asString()).as("vale dentro do contratante").isEqualTo("CLARO");
            String tokenDentro = dentro.path("tokenAcesso").asString();

            // Muda atuando no contratante: grava a dele (Plataforma), não a de ninguém do contratante.
            assertThat(status(put(ROTA, tokenDentro, Map.of("tema", "ESCURO")))).isEqualTo(204);
            assertThat(corpo(get("/api/auth/eu", tokenDentro)).path("temaPreferido").asString()).isEqualTo("ESCURO");
            assertThat(corpo(get("/api/auth/eu", c.admin().token())).path("temaPreferido").isNull()).isTrue();

            JsonNode fora = corpo(post("/api/auth/superadmin/sair", tokenDentro, Map.of()));
            assertThat(fora.path("usuario").path("temaPreferido").asString()).as("e volta com ele").isEqualTo("ESCURO");
        } finally {
            // Banco compartilhado: o superadmin volta a seguir o padrão para não afetar outros testes.
            put(ROTA, loginSuperadmin().token(), Collections.singletonMap("tema", null));
        }
    }
}
