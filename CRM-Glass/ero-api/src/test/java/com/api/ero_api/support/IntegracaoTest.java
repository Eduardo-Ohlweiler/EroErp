package com.api.ero_api.support;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Base dos testes de integração: sobe a API inteira com Postgres real
 * (Testcontainers) e chama os endpoints de verdade, passando por todos os
 * filtros de segurança.
 *
 * <p>O banco é compartilhado entre os testes: use sempre dados únicos
 * ({@link #unico(String)}) e nunca dependa de ordem.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class IntegracaoTest {

    protected static final String SUPERADMIN_EMAIL = "superadmin@teste.local";
    protected static final String SUPERADMIN_SENHA = "Orquidea-Lunar-Prisma-2026";
    /** Senha que passa na política, para usuários de teste. */
    protected static final String SENHA_FORTE = "Girassol#Verde#2026";
    protected static final String SENHA_FORTE_2 = "Cachoeira#Funda#2027";

    @Autowired
    protected MockMvcTester mvc;

    @Autowired
    protected JsonMapper json;

    /** Uma sessão aberta: token de acesso + cookie de refresh. */
    public record Sessao(String token, String refresh, JsonNode corpo) {
    }

    /** Contratante novo, com administrador já com senha definitiva. */
    public record Contratante(UUID id, String adminEmail, Sessao admin) {
    }

    protected static String unico(String prefixo) {
        return prefixo + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ------------------------------------------------------------ chamadas

    protected MvcTestResult get(String uri, String token) {
        return autenticar(mvc.get().uri(uri), token).exchange();
    }

    protected MvcTestResult post(String uri, String token, Object corpo) {
        return comCorpo(autenticar(mvc.post().uri(uri), token), corpo).exchange();
    }

    protected MvcTestResult put(String uri, String token, Object corpo) {
        return comCorpo(autenticar(mvc.put().uri(uri), token), corpo).exchange();
    }

    protected MvcTestResult patch(String uri, String token) {
        return autenticar(mvc.patch().uri(uri), token).exchange();
    }

    protected MvcTestResult patch(String uri, String token, Object corpo) {
        return comCorpo(autenticar(mvc.patch().uri(uri), token), corpo).exchange();
    }

    protected MvcTestResult refresh(String refreshToken) {
        MockMvcRequestBuilder b = mvc.post().uri("/api/auth/refresh").header("X-Ero-Refresh", "1");
        if (refreshToken != null) {
            b.cookie(new Cookie("ero_refresh", refreshToken));
        }
        return b.exchange();
    }

    protected MvcTestResult logout(String refreshToken) {
        return mvc.post().uri("/api/auth/logout").header("X-Ero-Refresh", "1")
                .cookie(new Cookie("ero_refresh", refreshToken)).exchange();
    }

    protected JsonNode corpo(MvcTestResult r) {
        try {
            return json.readTree(r.getResponse().getContentAsString(StandardCharsets.UTF_8));
        } catch (java.io.UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    protected static int status(MvcTestResult r) {
        return r.getResponse().getStatus();
    }

    protected static String cookieRefresh(MvcTestResult r) {
        Cookie c = r.getResponse().getCookie("ero_refresh");
        return c == null ? null : c.getValue();
    }

    // ------------------------------------------------------------ cenários

    protected MvcTestResult tentarLogin(String email, String senha) {
        return post("/api/auth/login", null, Map.of("email", email, "senha", senha));
    }

    protected Sessao login(String email, String senha) {
        MvcTestResult r = tentarLogin(email, senha);
        assertThat(status(r)).as("login de %s", email).isEqualTo(200);
        JsonNode c = corpo(r);
        return new Sessao(c.path("tokenAcesso").asString(), cookieRefresh(r), c);
    }

    protected Sessao loginSuperadmin() {
        return login(SUPERADMIN_EMAIL, SUPERADMIN_SENHA);
    }

    /** Login com senha temporária + troca para {@code novaSenha}. Devolve a sessão já liberada. */
    protected Sessao loginTrocandoSenha(String email, String senhaTemporaria, String novaSenha) {
        Sessao s = login(email, senhaTemporaria);
        assertThat(s.corpo().path("usuario").path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
        MvcTestResult troca = put("/api/auth/senha", s.token(),
                Map.of("senhaAtual", senhaTemporaria, "novaSenha", novaSenha));
        assertThat(status(troca)).as("troca de senha").isEqualTo(204);
        return s;
    }

    /** Cria contratante pelo superadmin e devolve a sessão do administrador dele. */
    protected Contratante novoContratante() {
        Sessao superadmin = loginSuperadmin();
        String nome = unico("Empresa");
        String adminEmail = unico("admin") + "@teste.local";
        MvcTestResult r = post("/api/tenants", superadmin.token(), Map.of(
                "nome", nome,
                "exige2fa", false,
                "administrador", Map.of("nome", "Ana Lima", "email", adminEmail, "senha", SENHA_FORTE)));
        assertThat(status(r)).as("criar contratante").isEqualTo(201);
        UUID id = UUID.fromString(corpo(r).path("id").asString());
        Sessao admin = loginTrocandoSenha(adminEmail, SENHA_FORTE, SENHA_FORTE_2);
        return new Contratante(id, adminEmail, admin);
    }

    /** Cadastra um USUARIO comum no contratante do admin e devolve {id, sessão}. */
    protected UsuarioCriado novoUsuario(Sessao admin) {
        String email = unico("usuario") + "@teste.local";
        MvcTestResult r = post("/api/usuarios", admin.token(), Map.of(
                "nome", "Bruno Rocha", "email", email, "senha", SENHA_FORTE, "papel", "USUARIO"));
        assertThat(status(r)).as("criar usuário").isEqualTo(201);
        UUID id = UUID.fromString(corpo(r).path("id").asString());
        return new UsuarioCriado(id, email);
    }

    public record UsuarioCriado(UUID id, String email) {
    }

    /** Substitui as liberações de um usuário (busca a version antes, como o front faz). */
    protected void liberar(String tokenAdmin, UUID usuarioId, java.util.List<Map<String, String>> liberacoes,
                           java.util.Set<String> acoes) {
        long versao = corpo(get("/api/permissoes/usuarios/" + usuarioId, tokenAdmin)).path("version").asLong();
        MvcTestResult r = put("/api/permissoes/usuarios/" + usuarioId, tokenAdmin,
                Map.of("liberacoes", liberacoes, "acoes", acoes, "version", versao));
        assertThat(status(r)).as("liberar permissões: %s", r.getResponse().getStatus()).isEqualTo(200);
    }

    protected static Map<String, String> grupo(String grupo, String nivel) {
        return Map.of("grupo", grupo, "nivel", nivel);
    }

    private static MockMvcRequestBuilder autenticar(MockMvcRequestBuilder b, String token) {
        if (token != null) {
            b.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        return b;
    }

    private MockMvcRequestBuilder comCorpo(MockMvcRequestBuilder b, Object corpo) {
        return b.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo));
    }
}
