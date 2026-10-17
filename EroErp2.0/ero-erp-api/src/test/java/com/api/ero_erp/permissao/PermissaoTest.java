package com.api.ero_erp.permissao;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.catalogo.entity.TipoCadastro;
import com.api.ero_erp.catalogo.repository.TipoCadastroRepository;
import com.api.ero_erp.permissao.entity.UsuarioPermissao;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.usuario.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Permissão por tela: o superadmin libera a tela ao USER com leitura ou
 * escrita; sem linha, sem acesso. ADMIN e SUPERADMIN acessam tudo.
 *
 * <p>A tela usada é Pessoas, a única de negócio hoje. Cada módulo novo protege
 * os próprios endpoints do mesmo jeito e merece o seu par de casos aqui.
 */
@DisplayName("Permissões por tela")
class PermissaoTest extends AbstractIntegrationTest {

    @Autowired TipoCadastroRepository tipoCadastroRepository;

    // ─────────────────────────────────────────────────────────────────
    //  Aplicação nos endpoints
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("USER sem permissão não lê Pessoas, mas usa o /select dos combos")
    void semPermissaoNaoLe() throws Exception {
        String token = autenticar(userA.getEmail());

        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, token))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/pessoas").header(AUTHORIZATION, token)
                        .contentType("application/json").content(pessoaJson("José")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/pessoas/select").header(AUTHORIZATION, token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("USER com leitura lê a lista e o registro, e não grava nada")
    void leituraNaoGrava() throws Exception {
        UUID id = criarPessoa(autenticar(adminA.getEmail()), "José");
        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        String token = autenticar(userA.getEmail());

        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/pessoas/{id}", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/pessoas").header(AUTHORIZATION, token)
                        .contentType("application/json").content(pessoaJson("Maria")))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/pessoas/{id}", id).header(AUTHORIZATION, token)
                        .contentType("application/json").content(pessoaJson("José Alterado")))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/pessoas/{id}/ativo", id).header(AUTHORIZATION, token)
                        .param("ativo", "false"))
                .andExpect(status().isForbidden());

        assertThat(pessoaRepository.findAll()).singleElement()
                .satisfies(p -> {
                    assertThat(p.getNome()).isEqualTo("José");
                    assertThat(p.getAtivo()).isTrue();
                });
    }

    @Test
    @DisplayName("USER com escrita cadastra")
    void escritaGrava() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.ESCRITA);

        criarPessoa(autenticar(userA.getEmail()), "José");
    }

    @Test
    @DisplayName("ADMIN acessa Pessoas sem permissão gravada")
    void adminAcessaTudo() throws Exception {
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();

        criarPessoa(autenticar(adminA.getEmail()), "José");
    }

    @Test
    @DisplayName("mudar a permissão vale na requisição seguinte, com o mesmo token")
    void mudancaValeSemNovoLogin() throws Exception {
        String token = autenticar(userA.getEmail());
        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, token))
                .andExpect(status().isForbidden());

        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, token))
                .andExpect(status().isOk());

        usuarioPermissaoRepository.deleteAllInBatch();
        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, token))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────────────────
    //  O que o front recebe
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o login publica as permissões já resolvidas: ADMIN tudo, USER só as dele")
    void loginPublicaPermissoesEfetivas() throws Exception {
        login(adminA.getEmail())
                .andExpect(jsonPath("$.permissoes.PESSOAS").value("ESCRITA"));

        login(userA.getEmail())
                .andExpect(jsonPath("$.permissoes").isEmpty());

        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        login(userA.getEmail())
                .andExpect(jsonPath("$.permissoes.PESSOAS").value("LEITURA"));
    }

    @Test
    @DisplayName("/usuarios/perfil/acesso devolve o mesmo mapa do login")
    void perfilAcessoAcompanhaOBanco() throws Exception {
        String token = autenticar(userA.getEmail());
        conceder(userA, Tela.PESSOAS, NivelAcesso.ESCRITA);

        mockMvc.perform(get("/usuarios/perfil/acesso").header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.PESSOAS").value("ESCRITA"));
    }

    @Test
    @DisplayName("o catálogo lista módulos e telas, e é só do superadmin")
    void catalogoESoDoSuperadmin() throws Exception {
        mockMvc.perform(get("/permissoes/catalogo").header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].modulo").value("CADASTROS"))
                .andExpect(jsonPath("$[0].rotulo").value("Cadastros"))
                .andExpect(jsonPath("$[0].telas[0].tela").value("PESSOAS"))
                .andExpect(jsonPath("$[0].telas[0].rotulo").value("Pessoas"));

        mockMvc.perform(get("/permissoes/catalogo").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro de usuário
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o superadmin cria USER com permissões, e a resposta as devolve")
    void criaUsuarioComPermissoes() throws Exception {
        mockMvc.perform(post("/usuarios").header(AUTHORIZATION, tokenNoTenantA())
                        .contentType("application/json")
                        .content("""
                                {"nome":"Ana","email":"ana@clinicaA.local","senha":"SenhaDaAna123",
                                 "role":"USER","permissoes":[{"tela":"PESSOAS","nivel":"LEITURA"}]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.permissoes", hasSize(1)))
                .andExpect(jsonPath("$.permissoes[0].tela").value("PESSOAS"))
                .andExpect(jsonPath("$.permissoes[0].nivel").value("LEITURA"));

        assertThat(usuarioPermissaoRepository.findAll()).singleElement()
                .satisfies(p -> assertThat(p.getTenant().getId()).isEqualTo(tenantA.getId()));
    }

    @Test
    @DisplayName("editar troca o nível e a lista é o estado completo")
    void editarSincroniza() throws Exception {
        String token = tokenNoTenantA();

        editar(token, "USER", """
                [{"tela":"PESSOAS","nivel":"ESCRITA"}]""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes[0].nivel").value("ESCRITA"));
        assertThat(nivelGravado()).isEqualTo(NivelAcesso.ESCRITA);

        editar(token, "USER", """
                [{"tela":"PESSOAS","nivel":"LEITURA"}]""")
                .andExpect(status().isOk());
        assertThat(nivelGravado()).isEqualTo(NivelAcesso.LEITURA);

        editar(token, "USER", "[]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes").isEmpty());
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("tela repetida na lista é recusada com 400")
    void telaRepetidaE400() throws Exception {
        editar(tokenNoTenantA(), "USER", """
                [{"tela":"PESSOAS","nivel":"LEITURA"},{"tela":"PESSOAS","nivel":"ESCRITA"}]""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A tela Pessoas aparece mais de uma vez nas permissões"));
    }

    @Test
    @DisplayName("ao promover a ADMIN as permissões gravadas somem, e não voltam ao rebaixar")
    void promoverApagaPermissoes() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        String token = tokenNoTenantA();

        editar(token, "ADMIN", """
                [{"tela":"PESSOAS","nivel":"LEITURA"}]""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes").isEmpty());
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();

        editar(token, "USER", "[]").andExpect(status().isOk());
        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("o detalhe do usuário traz as permissões gravadas")
    void detalheTrazPermissoes() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.ESCRITA);

        mockMvc.perform(get("/usuarios/{id}", userA.getId()).header(AUTHORIZATION, tokenNoTenantA()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes[0].tela").value("PESSOAS"))
                .andExpect(jsonPath("$.permissoes[0].nivel").value("ESCRITA"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("dentro do tenant A não se grava permissão de usuário do B — 404")
    void naoGravaPermissaoDeOutroTenant() throws Exception {
        UUID userB = criarUsuario(tenantB, "user.b@teste.local",
                Role.USER).getId();

        mockMvc.perform(put("/usuarios/{id}", userB).header(AUTHORIZATION, tokenNoTenantA())
                        .contentType("application/json")
                        .content("""
                                {"nome":"Invadido","email":"user.b@teste.local","role":"USER",
                                 "permissoes":[{"tela":"PESSOAS","nivel":"ESCRITA"}]}
                                """))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/usuarios/{id}", userB).header(AUTHORIZATION, tokenNoTenantA()))
                .andExpect(status().isNotFound());

        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("permissão do tenant A não libera os dados do B")
    void permissaoNaoAtravessaTenant() throws Exception {
        criarPessoa(autenticar(adminB.getEmail()), "Pessoa do B");
        conceder(userA, Tela.PESSOAS, NivelAcesso.ESCRITA);

        mockMvc.perform(get("/pessoas").header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // ─────────────────────────────────────────────────────────────────

    private String tokenNoTenantA() throws Exception {
        String corpo = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantA.getId())
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
    }

    private ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, SENHA_PADRAO)))
                .andExpect(status().isOk());
    }

    private ResultActions editar(String token, String role,
                                                                      String permissoes) throws Exception {
        return mockMvc.perform(put("/usuarios/{id}", userA.getId()).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("""
                        {"nome":"%s","email":"%s","role":"%s","permissoes":%s}
                        """.formatted(userA.getNome(), userA.getEmail(), role, permissoes)));
    }

    private NivelAcesso nivelGravado() {
        return usuarioPermissaoRepository.findAll().stream()
                .map(UsuarioPermissao::getNivel)
                .findFirst().orElseThrow();
    }

    private String pessoaJson(String nome) {
        return """
                {"nome":"%s","tipoPessoa":"PESSOA_FISICA","tiposCadastroIds":["%s"]}
                """.formatted(nome, tipoCliente());
    }

    private UUID criarPessoa(String token, String nome) throws Exception {
        String corpo = mockMvc.perform(post("/pessoas").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(pessoaJson(nome)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }

    private UUID tipoCliente() {
        return tipoCadastroRepository.findAllByAtivoTrueOrderByNome().stream()
                .filter(t -> t.getNome().equals("Cliente"))
                .map(TipoCadastro::getId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Seed sem o tipo Cliente"));
    }
}
