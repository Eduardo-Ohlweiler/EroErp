package com.api.ero_erp.permissao;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * As bordas das permissões por tela: entrada inválida, caminhos do cadastro que
 * não são o PUT comum, as outras respostas de autenticação e a tentativa de um
 * USER liberar telas para si.
 *
 * <p>O caminho principal está em {@link PermissaoTest}.
 */
@DisplayName("Permissões por tela — bordas")
class PermissaoBordasTest extends AbstractIntegrationTest {

    // ─────────────────────────────────────────────────────────────────
    //  Entrada inválida — 400, nunca 500, e nada gravado
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("nível que não existe é 400")
    void nivelInexistenteE400() throws Exception {
        editarUserA("""
                [{"tela":"PESSOAS","nivel":"TOTAL"}]""")
                .andExpect(status().isBadRequest());
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("tela que não existe é 400")
    void telaInexistenteE400() throws Exception {
        editarUserA("""
                [{"tela":"FINANCEIRO","nivel":"LEITURA"}]""")
                .andExpect(status().isBadRequest());
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("item sem tela ou sem nível é 400, com a mensagem do campo")
    void itemIncompletoE400() throws Exception {
        editarUserA("""
                [{"nivel":"LEITURA"}]""")
                .andExpect(status().isBadRequest());
        editarUserA("""
                [{"tela":"PESSOAS"}]""")
                .andExpect(status().isBadRequest());
        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("PUT sem a lista de permissões apaga as telas — a lista é o estado completo")
    void putSemListaApaga() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.ESCRITA);

        mockMvc.perform(put("/usuarios/{id}", userA.getId()).header(AUTHORIZATION, tokenNoTenantA())
                        .contentType("application/json")
                        .content("""
                                {"nome":"%s","email":"%s","role":"USER"}
                                """.formatted(userA.getNome(), userA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes").isEmpty());

        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Outros caminhos do cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cliente novo nasce ADMIN e ignora as permissões enviadas")
    void clienteNovoIgnoraPermissoes() throws Exception {
        mockMvc.perform(post("/usuarios").header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content("""
                                {"nome":"Clínica Nova","email":"dono@clinicanova.local",
                                 "senha":"SenhaDoDono123","role":"USER",
                                 "permissoes":[{"tela":"PESSOAS","nivel":"LEITURA"}]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.permissoes").isEmpty());

        assertThat(usuarioPermissaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("superadmin no tenant raiz cria USER noutro tenant: a permissão leva o tenant do usuário")
    void permissaoLevaOTenantDoUsuario() throws Exception {
        mockMvc.perform(post("/usuarios").header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content("""
                                {"nome":"Bia","email":"bia@clinicaA.local","senha":"SenhaDaBia123",
                                 "role":"USER","tenantId":"%s",
                                 "permissoes":[{"tela":"PESSOAS","nivel":"ESCRITA"}]}
                                """.formatted(tenantA.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").value(tenantA.getId().toString()))
                .andExpect(jsonPath("$.permissoes[0].nivel").value("ESCRITA"));

        assertThat(usuarioPermissaoRepository.findAll()).singleElement()
                .satisfies(p -> assertThat(p.getTenant().getId()).isEqualTo(tenantA.getId()));
    }

    @Test
    @DisplayName("inativar e desbloquear devolvem as permissões e não as apagam")
    void inativarEDesbloquearPreservam() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        String token = tokenNoTenantA();

        mockMvc.perform(patch("/usuarios/{id}/ativo", userA.getId()).header(AUTHORIZATION, token)
                        .param("ativo", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes[0].nivel").value("LEITURA"));

        mockMvc.perform(patch("/usuarios/{id}/desbloquear", userA.getId()).header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes[0].nivel").value("LEITURA"));

        assertThat(usuarioPermissaoRepository.findAll()).hasSize(1);
    }

    // ─────────────────────────────────────────────────────────────────
    //  As outras respostas de autenticação
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o refresh publica as permissões, e já as de agora")
    void refreshPublicaPermissoes() throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(userA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes").isEmpty())
                .andReturn().getResponse().getContentAsString();
        String refresh = objectMapper.readTree(corpo).get("refreshToken").asText();

        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);

        mockMvc.perform(post("/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refresh)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes.PESSOAS").value("LEITURA"));
    }

    @Test
    @DisplayName("na troca de tenant o superadmin segue com todas as telas")
    void trocaDeTenantPublicaTudo() throws Exception {
        mockMvc.perform(post("/auth/switch-tenant/{id}", tenantA.getId())
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissoes.PESSOAS").value("ESCRITA"));
    }

    @Test
    @DisplayName("/usuarios/perfil/acesso do ADMIN traz todas as telas em escrita")
    void acessoDoAdmin() throws Exception {
        mockMvc.perform(get("/usuarios/perfil/acesso").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.PESSOAS").value("ESCRITA"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Escalada
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("USER com escrita em Pessoas não se dá permissão, nem ADMIN dá a ninguém")
    void ninguemForaDoSuperadminEditaPermissoes() throws Exception {
        conceder(userA, Tela.PESSOAS, NivelAcesso.LEITURA);
        String corpo = """
                {"nome":"%s","email":"%s","role":"USER",
                 "permissoes":[{"tela":"PESSOAS","nivel":"ESCRITA"}]}
                """.formatted(userA.getNome(), userA.getEmail());

        for (String email : new String[]{userA.getEmail(), adminA.getEmail()}) {
            mockMvc.perform(put("/usuarios/{id}", userA.getId()).header(AUTHORIZATION, autenticar(email))
                            .contentType("application/json").content(corpo))
                    .andExpect(status().isForbidden());
        }
        mockMvc.perform(get("/permissoes/catalogo").header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isForbidden());

        assertThat(usuarioPermissaoRepository.findAll()).singleElement()
                .satisfies(p -> assertThat(p.getNivel()).isEqualTo(NivelAcesso.LEITURA));
    }

    // ─────────────────────────────────────────────────────────────────

    private String tokenNoTenantA() throws Exception {
        String corpo = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantA.getId())
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
    }

    private ResultActions editarUserA(String permissoes) throws Exception {
        return mockMvc.perform(put("/usuarios/{id}", userA.getId()).header(AUTHORIZATION, tokenNoTenantA())
                .contentType("application/json")
                .content("""
                        {"nome":"%s","email":"%s","role":"USER","permissoes":%s}
                        """.formatted(userA.getNome(), userA.getEmail(), permissoes)));
    }
}
