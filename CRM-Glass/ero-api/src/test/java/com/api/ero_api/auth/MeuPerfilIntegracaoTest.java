package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Minha conta, aba "Meus dados" ({@code GET|PUT /api/auth/eu/perfil}): o próprio
 * usuário altera nome e telefone. E-mail, papel e id não entram pelo corpo; o id vem
 * da sessão. Sem grupo de liberação ({@code ACESSO_LIBERADO}): quem tem pendência não entra.
 */
class MeuPerfilIntegracaoTest extends IntegracaoTest {

    private static final String ROTA = "/api/auth/eu/perfil";

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_alteraNomeETelefoneEOEuTrazONomeNovoNaHora() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String adminId = c.admin().corpo().path("usuario").path("id").asString();
        // O /eu guarda o usuário da sessão em cache por 30 s: a 1ª chamada aquece o cache.
        assertThat(corpo(get("/api/auth/eu", token)).path("nome").asString()).isEqualTo("Ana Lima");

        JsonNode perfil = corpo(get(ROTA, token));
        assertThat(perfil.path("id").asString()).isEqualTo(adminId);
        assertThat(perfil.path("nome").asString()).isEqualTo("Ana Lima");
        assertThat(perfil.path("email").asString()).isEqualTo(c.adminEmail());
        assertThat(perfil.path("telefone").isNull()).isTrue();
        assertThat(perfil.path("papel").asString()).isEqualTo("ADMIN");
        assertThat(perfil.path("tenantNome").asString()).isEqualTo(corpo(get("/api/tenants/atual", token)).path("nome").asString());
        assertThat(perfil.has("temaPreferido")).isTrue();
        long versao = perfil.path("version").asLong();

        MvcTestResult r = put(ROTA, token, Map.of("nome", "  Ana Prado  ", "telefone", "11987654321", "version", versao));
        assertThat(status(r)).isEqualTo(200);
        JsonNode alterado = corpo(r);
        assertThat(alterado.path("nome").asString()).isEqualTo("Ana Prado");
        assertThat(alterado.path("telefone").asString()).isEqualTo("11987654321");
        assertThat(alterado.path("version").asLong()).as("resposta já traz a versão nova").isEqualTo(versao + 1);

        assertThat(corpo(get("/api/auth/eu", token)).path("nome").asString()).as("barra com o nome novo na hora").isEqualTo("Ana Prado");
        JsonNode ficha = corpo(get("/api/usuarios/" + adminId, token));
        assertThat(ficha.path("telefone").asString()).isEqualTo("11987654321");
        assertThat(ficha.path("alteradoPorNome").asString()).isEqualTo("Ana Prado");

        // A versão devolvida serve para salvar de novo; telefone vazio limpa.
        MvcTestResult limpo = put(ROTA, token, Map.of("nome", "Ana Prado", "telefone", "", "version", versao + 1));
        assertThat(status(limpo)).isEqualTo(200);
        assertThat(corpo(limpo).path("telefone").isNull()).isTrue();
    }

    @Test
    void validacaoRecusada_nomeVazioOuLongoETelefoneInvalidoDa400ENaoMuda() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        long versao = corpo(get(ROTA, token)).path("version").asLong();

        assertThat(campos(put(ROTA, token, Map.of("nome", "", "version", versao)))).containsExactly("nome");
        assertThat(campos(put(ROTA, token, Map.of("nome", "   ", "version", versao)))).containsExactly("nome");
        assertThat(campos(put(ROTA, token, Map.of("nome", "a".repeat(151), "version", versao)))).containsExactly("nome");
        assertThat(campos(put(ROTA, token, Map.of("nome", "Ana Lima", "telefone", "123", "version", versao))))
                .containsExactly("telefone");
        assertThat(campos(put(ROTA, token, Map.of("nome", "Ana Lima", "telefone", "(11) 98765-4321", "version", versao))))
                .as("o front manda só dígitos").containsExactly("telefone");
        assertThat(campos(put(ROTA, token, Map.of("nome", "Ana Lima")))).containsExactly("version");

        JsonNode depois = corpo(get(ROTA, token));
        assertThat(depois.path("nome").asString()).isEqualTo("Ana Lima");
        assertThat(depois.path("version").asLong()).as("nada mudou").isEqualTo(versao);
        assertThat(status(put(ROTA, token, Map.of("nome", "a".repeat(150), "version", versao)))).as("150 cabe").isEqualTo(200);
    }

    /**
     * O corpo não escolhe de quem são os dados nem muda e-mail ou papel: id, e-mail e
     * papel extras são ignorados. Cada um só altera o próprio, sem vazar entre contratantes.
     */
    @Test
    void isolamento_corpoComIdEmailEPapelExtrasNaoMudaNadaDeNinguem() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado colega = novoUsuario(a.admin());
        Sessao sessaoColega = loginTrocandoSenha(colega.email(), SENHA_FORTE, SENHA_FORTE_2);
        String adminB = b.admin().corpo().path("usuario").path("id").asString();
        long versao = corpo(get(ROTA, sessaoColega.token())).path("version").asLong();

        Map<String, Object> pedido = new HashMap<>();
        pedido.put("nome", "Bruno Novo");
        pedido.put("version", versao);
        pedido.put("id", adminB);
        pedido.put("usuarioId", adminB);
        pedido.put("email", unico("tomada") + "@teste.local");
        pedido.put("papel", "ADMIN");
        pedido.put("tenantId", b.id().toString());
        MvcTestResult r = put(ROTA, sessaoColega.token(), pedido);
        assertThat(status(r)).isEqualTo(200);

        JsonNode meu = corpo(get(ROTA, sessaoColega.token()));
        assertThat(meu.path("id").asString()).isEqualTo(colega.id().toString());
        assertThat(meu.path("nome").asString()).isEqualTo("Bruno Novo");
        assertThat(meu.path("email").asString()).as("e-mail só pelo administrador").isEqualTo(colega.email());
        assertThat(meu.path("papel").asString()).as("papel não sobe").isEqualTo("USUARIO");
        assertThat(corpo(get("/api/auth/eu", sessaoColega.token())).path("permissoes").valueStream()
                .map(JsonNode::asString).toList()).doesNotContain("USUARIOS_LER", "ROLE_ADMIN");
        assertThat(status(tentarLogin(colega.email(), SENHA_FORTE_2))).as("continua entrando com o e-mail dele").isEqualTo(200);

        assertThat(corpo(get(ROTA, b.admin().token())).path("nome").asString()).as("outro contratante intacto").isEqualTo("Ana Lima");
        assertThat(corpo(get(ROTA, a.admin().token())).path("nome").asString()).as("colega intacto").isEqualTo("Ana Lima");
    }

    /** Par de acesso: sem grupo; qualquer logado sem pendência lê e altera o próprio. */
    @Test
    void parAcesso_semTokenDa401PendenciaDa403EUsuarioSemGrupoAlteraOProprio() {
        assertThat(status(get(ROTA, null))).isEqualTo(401);
        assertThat(status(put(ROTA, null, Map.of("nome", "X", "version", 0)))).isEqualTo(401);

        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao pendente = loginComCodigo(u.email(), SENHA_FORTE);
        assertThat(pendente.corpo().path("usuario").path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
        assertThat(status(get(ROTA, pendente.token()))).as("senha temporária: só troca a senha").isEqualTo(403);
        assertThat(status(put(ROTA, pendente.token(), Map.of("nome", "Bruno Pendente", "version", 0)))).isEqualTo(403);

        Sessao liberado = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        assertThat(status(get("/api/usuarios", liberado.token()))).as("sem nenhum grupo").isEqualTo(403);
        long versao = corpo(get(ROTA, liberado.token())).path("version").asLong();
        assertThat(status(put(ROTA, liberado.token(), Map.of("nome", "Bruno Liberado", "telefone", "4733221100",
                "version", versao)))).isEqualTo(200);
        assertThat(corpo(get("/api/usuarios/" + u.id(), c.admin().token())).path("nome").asString()).isEqualTo("Bruno Liberado");
    }

    // ------------------------------------------------------------ regras

    @Test
    void versaoAntigaDa409EOAdminComAFichaAbertaTambem() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        long versao = corpo(get(ROTA, s.token())).path("version").asLong();
        long versaoFichaDoAdmin = corpo(get("/api/usuarios/" + u.id(), c.admin().token())).path("version").asLong();

        assertThat(status(put(ROTA, s.token(), Map.of("nome", "Primeira", "version", versao)))).isEqualTo(200);
        MvcTestResult antiga = put(ROTA, s.token(), Map.of("nome", "Segunda", "version", versao));
        assertThat(status(antiga)).isEqualTo(409);
        assertThat(corpo(antiga).has("erros")).as("sem erros: o front oferece Recarregar").isFalse();

        MvcTestResult admin = put("/api/usuarios/" + u.id(), c.admin().token(), Map.of(
                "nome", "Pelo Admin", "email", u.email(), "papel", "USUARIO", "version", versaoFichaDoAdmin));
        assertThat(status(admin)).as("o perfil próprio sobe a version do cadastro").isEqualTo(409);
        assertThat(corpo(get(ROTA, s.token())).path("nome").asString()).isEqualTo("Primeira");

        // E o contrário: o admin salvou a ficha, a tela de Minha conta aberta recebe 409.
        long atual = corpo(get("/api/usuarios/" + u.id(), c.admin().token())).path("version").asLong();
        assertThat(status(put("/api/usuarios/" + u.id(), c.admin().token(), Map.of(
                "nome", "Pelo Admin", "email", u.email(), "papel", "USUARIO", "version", atual)))).isEqualTo(200);
        assertThat(status(put(ROTA, s.token(), Map.of("nome", "Terceira", "version", atual)))).isEqualTo(409);
    }

    /** O evento fica na trilha do contratante, sem o telefone (dado pessoal). */
    @Test
    void gravaEventoUsuarioAlteradoSemOTelefone() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String adminId = c.admin().corpo().path("usuario").path("id").asString();
        long versao = corpo(get(ROTA, token)).path("version").asLong();
        assertThat(status(put(ROTA, token, Map.of("nome", "Ana Lima", "telefone", "51999887766", "version", versao))))
                .isEqualTo(200);

        JsonNode eventos = corpo(get("/api/auditoria/eventos?tipos=USUARIO_ALTERADO&usuarioId=" + adminId, token));
        assertThat(eventos.path("totalElementos").asLong()).isEqualTo(1);
        JsonNode e = eventos.path("conteudo").get(0);
        assertThat(e.path("detalhe").asString()).isEqualTo("próprio perfil");
        assertThat(e.path("autorId").asString()).isEqualTo(adminId);
        assertThat(eventos.toString()).doesNotContain("51999887766").doesNotContain("99887766");
    }

    /**
     * O superadmin dentro de um contratante altera o próprio nome (é dele, da Plataforma)
     * e continua invisível para o contratante: não aparece na lista nem nos combos.
     */
    @Test
    void superadminDentroDoContratanteAlteraOProprioNomeESegueInvisivel() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        String superadminId = s.corpo().path("usuario").path("id").asString();
        String nomeOriginal = corpo(get(ROTA, s.token())).path("nome").asString();
        String nomeNovo = unico("Suporte");
        String dentro = corpo(post("/api/auth/superadmin/acessar/" + c.id(), s.token(), Map.of())).path("tokenAcesso").asString();
        try {
            JsonNode perfil = corpo(get(ROTA, dentro));
            assertThat(perfil.path("id").asString()).isEqualTo(superadminId);
            assertThat(perfil.path("papel").asString()).isEqualTo("SUPERADMIN");
            assertThat(perfil.path("tenantNome").asString()).as("ele é da Plataforma, mesmo dentro").isEqualTo("Plataforma");

            MvcTestResult r = put(ROTA, dentro, Map.of("nome", nomeNovo, "version", perfil.path("version").asLong()));
            assertThat(status(r)).isEqualTo(200);
            assertThat(corpo(get("/api/auth/eu", dentro)).path("nome").asString()).isEqualTo(nomeNovo);

            String admin = c.admin().token();
            assertThat(corpo(get("/api/usuarios?size=100", admin)).toString()).doesNotContain(nomeNovo).doesNotContain(superadminId);
            assertThat(corpo(get("/api/usuarios/selecao?inativos=true", admin)).toString()).doesNotContain(nomeNovo);
            assertThat(corpo(get("/api/usuarios?size=100", dentro)).toString()).as("nem para ele lá dentro").doesNotContain(superadminId);
            List<String> doContratante = corpo(get("/api/auditoria/eventos?size=100&tipos=USUARIO_ALTERADO", admin))
                    .path("conteudo").valueStream().map(JsonNode::toString).toList();
            assertThat(doContratante).as("o evento é da Plataforma, não do contratante")
                    .noneMatch(t -> t.contains("próprio perfil"));
        } finally {
            // Banco compartilhado: outros testes conferem o nome do superadmin.
            Sessao nova = loginSuperadmin();
            long versao = corpo(get(ROTA, nova.token())).path("version").asLong();
            put(ROTA, nova.token(), Map.of("nome", nomeOriginal, "version", versao));
        }
        assertThat(corpo(get(ROTA, loginSuperadmin().token())).path("nome").asString()).isEqualTo(nomeOriginal);
    }

    private List<String> campos(MvcTestResult r) {
        assertThat(status(r)).isEqualTo(400);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }
}
