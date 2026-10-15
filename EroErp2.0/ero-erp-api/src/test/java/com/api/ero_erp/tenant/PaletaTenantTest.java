package com.api.ero_erp.tenant;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.tenant.enums.PaletaSistema;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Paleta por tenant")
class PaletaTenantTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("tenant novo nasce na paleta padrão, e o login a entrega")
    void tenantNovoNascePadrao() throws Exception {
        mockMvc.perform(get("/tenants/{id}", tenantA.getId())
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paleta").value("PADRAO"));

        login(adminA.getEmail())
                .andExpect(jsonPath("$.paleta").value("PADRAO"));
    }

    @Test
    @DisplayName("superadmin troca a paleta de um tenant, e só os usuários dele a recebem")
    void paletaEDoTenant() throws Exception {
        definir(autenticar(superadmin.getEmail()), tenantA.getId().toString(), "JADE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paleta").value("JADE"));

        login(adminA.getEmail()).andExpect(jsonPath("$.paleta").value("JADE"));
        login(userA.getEmail()).andExpect(jsonPath("$.paleta").value("JADE"));
        login(adminB.getEmail()).andExpect(jsonPath("$.paleta").value("PADRAO"));
    }

    @Test
    @DisplayName("a troca de tenant leva a paleta do destino, e a volta a da origem")
    void trocaDeTenantLevaAPaleta() throws Exception {
        tenantB.setPaleta(PaletaSistema.CAFE_MENU_ESCURO);
        tenantRepository.save(tenantB);

        String raiz = autenticar(superadmin.getEmail());
        String noTenantB = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId())
                        .header(AUTHORIZATION, raiz))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paleta").value("CAFE_MENU_ESCURO"))
                .andReturn().getResponse().getContentAsString();

        String tokenB = "Bearer " + objectMapper.readTree(noTenantB).get("accessToken").asText();

        mockMvc.perform(post("/auth/exit-tenant").header(AUTHORIZATION, tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paleta").value("PADRAO"));
    }

    @Test
    @DisplayName("ADMIN e USER não escolhem paleta, nem a do próprio tenant")
    void adminEUserNaoEscrevem() throws Exception {
        definir(autenticar(adminA.getEmail()), tenantA.getId().toString(), "JADE")
                .andExpect(status().isForbidden());
        definir(autenticar(userA.getEmail()), tenantA.getId().toString(), "JADE")
                .andExpect(status().isForbidden());

        login(adminA.getEmail()).andExpect(jsonPath("$.paleta").value("PADRAO"));
    }

    @Test
    @DisplayName("sem token é 401")
    void semTokenE401() throws Exception {
        mockMvc.perform(patch("/tenants/{id}/paleta", tenantA.getId())
                        .contentType("application/json")
                        .content(corpo("JADE")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("paleta ausente ou inexistente é 400")
    void paletaInvalidaE400() throws Exception {
        String token = autenticar(superadmin.getEmail());

        mockMvc.perform(patch("/tenants/{id}/paleta", tenantA.getId())
                        .header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest());

        definir(token, tenantA.getId().toString(), "TERRACOTA")
                .andExpect(status().isBadRequest());
    }

    /**
     * A antiga rota pública de leitura da paleta global não pode voltar: sem
     * tenant não há paleta, e a única superfície pública é login e refresh.
     */
    @Test
    @DisplayName("não há mais rota pública de aparência")
    void naoHaRotaPublicaDeAparencia() throws Exception {
        mockMvc.perform(get("/configuracoes/aparencia"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * O enum e o {@code CHECK} da migration 015 são duas listas da mesma coisa.
     * Uma paleta nova no enum e esquecida no banco passaria em todo o resto e
     * explodiria só na tela do superadmin, no dia em que ele a escolhesse.
     */
    @Test
    @DisplayName("o banco aceita toda paleta que o enum declara")
    void bancoAceitaTodoValorDoEnum() throws Exception {
        String token = autenticar(superadmin.getEmail());

        for (PaletaSistema paleta : PaletaSistema.values()) {
            definir(token, tenantA.getId().toString(), paleta.name())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.paleta").value(paleta.name()));
        }
    }

    private ResultActions definir(
            String token, String tenantId, String paleta) throws Exception {
        return mockMvc.perform(patch("/tenants/{id}/paleta", tenantId)
                .header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(corpo(paleta)));
    }

    private ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, SENHA_PADRAO)))
                .andExpect(status().isOk());
    }

    private static String corpo(String paleta) {
        return """
                {"paleta":"%s"}
                """.formatted(paleta);
    }
}
