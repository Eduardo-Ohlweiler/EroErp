package com.api.ero_erp.usuario;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * O BCrypt só olha os primeiros 72 <b>bytes</b> da senha, e o Spring Security
 * recusa com exceção o que passa disso. Contar caracteres não basta: "é" ocupa
 * dois bytes em UTF-8, e 40 deles cabem num {@code @Size(max = 72)} e estouram
 * o encoder — um 500 na tela de quem só escolheu uma senha acentuada.
 *
 * <p>Teto e piso juntos: 80 bytes é 400 com a frase dos bytes, 72 bytes
 * exatos grava e entra.
 */
@DisplayName("Senha: o limite de 72 bytes do BCrypt")
class SenhaLimiteBytesTest extends AbstractIntegrationTest {

    /** 40 caracteres, 80 bytes. */
    private static final String SENHA_80_BYTES = "é".repeat(40);
    /** 36 caracteres, 72 bytes — exatamente no limite. */
    private static final String SENHA_72_BYTES = "é".repeat(36);

    @Test
    @DisplayName("as constantes medem o que dizem medir")
    void tamanhosDasConstantes() {
        assertThat(SENHA_80_BYTES.getBytes(StandardCharsets.UTF_8)).hasSize(80);
        assertThat(SENHA_72_BYTES.getBytes(StandardCharsets.UTF_8)).hasSize(72);
    }

    // ─── POST /usuarios ─────────────────────────────────────────────────

    @Test
    @DisplayName("criar usuário com senha de 80 bytes é 400 com a frase dos bytes")
    void criarCom80BytesE400() throws Exception {
        criarUsuario("longa@a.local", SENHA_80_BYTES)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("72 bytes")));

        assertThat(usuarioRepository.findByEmailIgnoreCase("longa@a.local")).isEmpty();
    }

    @Test
    @DisplayName("criar usuário com senha de 72 bytes grava, e ela entra")
    void criarCom72BytesEntra() throws Exception {
        criarUsuario("limite@a.local", SENHA_72_BYTES).andExpect(status().isCreated());

        login("limite@a.local", SENHA_72_BYTES).andExpect(status().isOk());
    }

    // ─── PATCH /usuarios/{id}/senha ─────────────────────────────────────

    @Test
    @DisplayName("redefinir com 80 bytes é 400 e a senha antiga continua valendo")
    void redefinirCom80BytesE400() throws Exception {
        redefinir(adminA.getId(), SENHA_80_BYTES)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("72 bytes")));

        login(adminA.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    @Test
    @DisplayName("redefinir com 72 bytes grava, e ela entra")
    void redefinirCom72BytesEntra() throws Exception {
        redefinir(adminA.getId(), SENHA_72_BYTES).andExpect(status().isNoContent());

        login(adminA.getEmail(), SENHA_72_BYTES).andExpect(status().isOk());
    }

    // ─── PATCH /usuarios/perfil/senha ───────────────────────────────────

    @Test
    @DisplayName("trocar a própria senha por uma de 80 bytes é 400 e a antiga continua valendo")
    void trocarCom80BytesE400() throws Exception {
        trocarPropria(autenticar(adminA.getEmail()), SENHA_PADRAO, SENHA_80_BYTES)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("72 bytes")));

        login(adminA.getEmail(), SENHA_PADRAO).andExpect(status().isOk());
    }

    @Test
    @DisplayName("senha atual de 80 bytes também é 400, não 500")
    void senhaAtualCom80BytesE400() throws Exception {
        trocarPropria(autenticar(adminA.getEmail()), SENHA_80_BYTES, "OutraSenhaValida1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("72 bytes")));
    }

    @Test
    @DisplayName("trocar a própria senha por uma de 72 bytes grava, e ela entra")
    void trocarCom72BytesEntra() throws Exception {
        trocarPropria(autenticar(adminA.getEmail()), SENHA_PADRAO, SENHA_72_BYTES)
                .andExpect(status().isNoContent());

        login(adminA.getEmail(), SENHA_72_BYTES).andExpect(status().isOk());
    }

    // ─── POST /auth/login ───────────────────────────────────────────────

    @Test
    @DisplayName("login com senha de 100 bytes é 400, não 500, e não conta tentativa")
    void loginCom100BytesE400() throws Exception {
        login(adminA.getEmail(), "é".repeat(50))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("72 bytes")));

        assertThat(usuarioRepository.findById(adminA.getId()).orElseThrow().getTentativasFalhas())
                .isZero();
    }

    // ────────────────────────────────────────────────────────────────────

    private ResultActions criarUsuario(String email, String senha) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("tenantId", tenantA.getId());
        corpo.put("nome", "Usuário da Senha");
        corpo.put("email", email);
        corpo.put("senha", senha);
        corpo.put("role", "USER");
        return mockMvc.perform(post("/usuarios")
                .header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(corpo)));
    }

    private ResultActions redefinir(UUID usuarioId, String senhaNova) throws Exception {
        return mockMvc.perform(patch("/usuarios/{id}/senha", usuarioId)
                .header(AUTHORIZATION, tokenDoSuperadminNo(tenantA.getId()))
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(Map.of("senhaNova", senhaNova))));
    }

    private ResultActions trocarPropria(String token, String atual, String nova) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("senhaAtual", atual);
        corpo.put("senhaNova", nova);
        return mockMvc.perform(patch("/usuarios/perfil/senha")
                .header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(corpo)));
    }

    private ResultActions login(String email, String senha) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("email", email);
        corpo.put("senha", senha);
        return mockMvc.perform(post("/auth/login")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(corpo)));
    }

    private String tokenDoSuperadminNo(UUID tenantId) throws Exception {
        String corpo = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantId)
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
    }
}
