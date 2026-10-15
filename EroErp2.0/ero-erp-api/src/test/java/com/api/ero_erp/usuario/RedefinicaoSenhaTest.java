package com.api.ero_erp.usuario;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.usuario.entity.Usuario;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Redefinição de senha pelo superadmin")
class RedefinicaoSenhaTest extends AbstractIntegrationTest {

    private static final String SENHA_NOVA = "SenhaNovaDoUsuario1";

    @Test
    @DisplayName("a senha antiga deixa de entrar e a nova passa a entrar")
    void trocaASenha() throws Exception {
        redefinir(tokenDoSuperadminNo(tenantA.getId()), adminA.getId(), SENHA_NOVA)
                .andExpect(status().isNoContent());

        login(adminA.getEmail(), SENHA_PADRAO).andExpect(status().isUnauthorized());
        login(adminA.getEmail(), SENHA_NOVA).andExpect(status().isOk());

        assertThat(usuarioRepository.findById(adminA.getId()).orElseThrow().getSenha())
                .as("gravada com BCrypt, nunca em claro")
                .startsWith("$2a$")
                .isNotEqualTo(SENHA_NOVA);
    }

    @Test
    @DisplayName("quem errou a senha cinco vezes volta a entrar com a nova")
    void desbloqueiaAConta() throws Exception {
        Usuario bloqueado = usuarioRepository.findById(adminA.getId()).orElseThrow();
        bloqueado.setTentativasFalhas(5);
        bloqueado.setBloqueadoAte(Instant.now().plus(15, ChronoUnit.MINUTES));
        usuarioRepository.save(bloqueado);

        redefinir(tokenDoSuperadminNo(tenantA.getId()), adminA.getId(), SENHA_NOVA)
                .andExpect(status().isNoContent());

        Usuario depois = usuarioRepository.findById(adminA.getId()).orElseThrow();
        assertThat(depois.estaBloqueado()).isFalse();
        assertThat(depois.getTentativasFalhas()).isZero();
        login(adminA.getEmail(), SENHA_NOVA).andExpect(status().isOk());
    }

    /**
     * Redefinir também é a resposta a uma conta tomada: a sessão aberta pode ser
     * a do intruso. O access token emitido antes tem de cair na hora, não daqui
     * a 8 horas, e o refresh não pode trazê-lo de volta.
     */
    @Test
    @DisplayName("encerra as sessões abertas: access token e refresh emitidos antes caem")
    void encerraAsSessoesAbertas() throws Exception {
        JsonNode sessao = objectMapper.readTree(login(adminA.getEmail(), SENHA_PADRAO)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        String accessAntigo = "Bearer " + sessao.get("accessToken").asText();
        String refreshAntigo = sessao.get("refreshToken").asText();

        mockMvc.perform(get("/usuarios/perfil").header(AUTHORIZATION, accessAntigo))
                .andExpect(status().isOk());

        redefinir(tokenDoSuperadminNo(tenantA.getId()), adminA.getId(), SENHA_NOVA)
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/usuarios/perfil").header(AUTHORIZATION, accessAntigo))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refreshAntigo)))
                .andExpect(status().isUnauthorized());

        // E o corte não pega quem entra depois, nem no mesmo segundo.
        mockMvc.perform(get("/usuarios/perfil")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail(), SENHA_NOVA)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("ADMIN e USER não redefinem senha de ninguém")
    void soOSuperadminRedefine() throws Exception {
        redefinir(autenticar(adminA.getEmail()), userA.getId(), SENHA_NOVA)
                .andExpect(status().isForbidden());
        redefinir(autenticar(userA.getEmail()), adminA.getId(), SENHA_NOVA)
                .andExpect(status().isForbidden());

        login(userA.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    @Test
    @DisplayName("senha nova com menos de 10 caracteres é 400")
    void senhaCurtaE400() throws Exception {
        redefinir(tokenDoSuperadminNo(tenantA.getId()), adminA.getId(), "curta123")
                .andExpect(status().isBadRequest());

        login(adminA.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    /** Escrita é dentro do tenant: a tela entra no tenant do usuário antes. */
    @Test
    @DisplayName("usuário de outro tenant é 404 sem entrar nele")
    void foraDoTenantE404() throws Exception {
        redefinir(autenticar(superadmin.getEmail()), adminA.getId(), SENHA_NOVA)
                .andExpect(status().isNotFound());

        login(adminA.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    @Test
    @DisplayName("a própria senha não se redefine por aqui — é pelo perfil")
    void propriaSenhaE400() throws Exception {
        redefinir(autenticar(superadmin.getEmail()), superadmin.getId(), SENHA_NOVA)
                .andExpect(status().isBadRequest());

        login(superadmin.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    private String tokenDoSuperadminNo(UUID tenantId) throws Exception {
        String corpo = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantId)
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
    }

    private ResultActions redefinir(String token, UUID usuarioId, String senhaNova) throws Exception {
        return mockMvc.perform(patch("/usuarios/{id}/senha", usuarioId)
                .header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("""
                        {"senhaNova":"%s"}
                        """.formatted(senhaNova)));
    }

    private ResultActions login(String email, String senha) throws Exception {
        return mockMvc.perform(post("/auth/login")
                .contentType("application/json")
                .content("""
                        {"email":"%s","senha":"%s"}
                        """.formatted(email, senha)));
    }
}
