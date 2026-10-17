package com.api.ero_erp.usuario;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Quem pode virar superadmin, e onde.
 *
 * <p>Só o tenant do sistema — o de origem do superadmin logado — abriga
 * superadmins. O tenant que abriga um nunca expira (a rotina diária e o login o
 * poupam), então um superadmin num tenant de cliente tiraria esse cliente da
 * licença sem ninguém perceber.
 */
@DisplayName("Concessão do nível superadministrador")
class ConcessaoSuperadminTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("o superadmin cria outro superadmin no tenant do sistema")
    void criaNoTenantDoSistema() throws Exception {
        mockMvc.perform(post("/usuarios").header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content("""
                                {"nome":"Segundo Root","email":"root2@teste.local","senha":"SenhaDoRoot123",
                                 "role":"SUPERADMIN","tenantId":"%s"}
                                """.formatted(superadmin.getTenant().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("SUPERADMIN"));
    }

    @Test
    @DisplayName("o superadmin promove um usuário do tenant do sistema")
    void promoveNoTenantDoSistema() throws Exception {
        Usuario colega = criarUsuario(superadmin.getTenant(), "colega@teste.local", Role.ADMIN);

        editar(autenticar(superadmin.getEmail()), colega, "SUPERADMIN")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SUPERADMIN"));
    }

    @Test
    @DisplayName("criar superadmin num tenant de cliente é 400, e o usuário não nasce")
    void naoCriaEmTenantDeCliente() throws Exception {
        mockMvc.perform(post("/usuarios").header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content("""
                                {"nome":"Intruso","email":"intruso@clinicaA.local","senha":"SenhaDoIntruso1",
                                 "role":"SUPERADMIN","tenantId":"%s"}
                                """.formatted(tenantA.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Superadministrador só existe no tenant do sistema"));

        assertThat(usuarioRepository.findByEmailIgnoreCase("intruso@clinicaa.local")).isEmpty();
    }

    @Test
    @DisplayName("promover a superadmin dentro de um tenant de cliente é 400, e o nível não muda")
    void naoPromoveEmTenantDeCliente() throws Exception {
        String raiz = autenticar(superadmin.getEmail());
        String corpo = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantA.getId())
                        .header(AUTHORIZATION, raiz))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String noTenantA = "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();

        editar(noTenantA, adminA, "SUPERADMIN")
                .andExpect(status().isBadRequest());

        assertThat(usuarioRepository.findById(adminA.getId()).orElseThrow().getRole())
                .isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("o superadmin não rebaixa o próprio nível")
    void naoRebaixaASiMesmo() throws Exception {
        editar(autenticar(superadmin.getEmail()), superadmin, "ADMIN")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Você não pode rebaixar o próprio nível de acesso"));

        assertThat(usuarioRepository.findById(superadmin.getId()).orElseThrow().getRole())
                .isEqualTo(Role.SUPERADMIN);
    }

    private ResultActions editar(String token, Usuario alvo,
                                                                      String role) throws Exception {
        return mockMvc.perform(put("/usuarios/{id}", alvo.getId()).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("""
                        {"nome":"%s","email":"%s","role":"%s"}
                        """.formatted(alvo.getNome(), alvo.getEmail(), role)));
    }
}
