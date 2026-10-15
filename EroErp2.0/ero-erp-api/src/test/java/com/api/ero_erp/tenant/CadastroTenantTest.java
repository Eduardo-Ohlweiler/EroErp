package com.api.ero_erp.tenant;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.tenant.entity.Tenant;
import com.api.ero_erp.tenant.enums.PaletaSistema;
import com.api.ero_erp.tenant.enums.PeriodoAcesso;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * O tenant aberto pela tela de tenants, sem usuário. O outro caminho — nascer
 * junto do primeiro usuário — está em {@code CriacaoDeClienteTest}.
 */
@DisplayName("Cadastro de tenant")
class CadastroTenantTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("só com o nome: nasce ativo, sem prazo e na paleta padrão, e sem usuário")
    void soComONome() throws Exception {
        long usuariosAntes = usuarioRepository.count();

        String corpo = criar(autenticar(superadmin.getEmail()), """
                        {"nome":"Empresa Nova"}
                        """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Empresa Nova"))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.periodoAcesso").value("INDETERMINADO"))
                .andExpect(jsonPath("$.acessoExpiraEm").doesNotExist())
                .andExpect(jsonPath("$.paleta").value("PADRAO"))
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
        assertThat(tenantRepository.findById(id)).isPresent();
        assertThat(usuarioRepository.count())
                .as("o tenant nasce sem usuário — eles vêm depois")
                .isEqualTo(usuariosAntes);
    }

    @Test
    @DisplayName("com período e paleta: a data de expiração é calculada e a paleta, gravada")
    void comPeriodoEPaleta() throws Exception {
        String corpo = criar(autenticar(superadmin.getEmail()), """
                        {"nome":"Empresa Prazo","periodoAcesso":"UM_MES","paleta":"JADE"}
                        """)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Tenant novo = tenantRepository.findById(
                UUID.fromString(objectMapper.readTree(corpo).get("id").asText())).orElseThrow();

        assertThat(novo.getPeriodoAcesso()).isEqualTo(PeriodoAcesso.UM_MES);
        assertThat(novo.getPaleta()).isEqualTo(PaletaSistema.JADE);
        // Fim do dia, um mês à frente — a tolerância cobre o fuso da máquina.
        assertThat(ChronoUnit.DAYS.between(Instant.now(), novo.getAcessoExpiraEm()))
                .isBetween(27L, 32L);
    }

    @Test
    @DisplayName("nome vazio, período ou paleta inexistentes são 400")
    void entradaInvalidaE400() throws Exception {
        String token = autenticar(superadmin.getEmail());

        criar(token, """
                {"nome":"  "}
                """).andExpect(status().isBadRequest());
        criar(token, """
                {"nome":"X","periodoAcesso":"TRES_DIAS"}
                """).andExpect(status().isBadRequest());
        criar(token, """
                {"nome":"X","paleta":"TERRACOTA"}
                """).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("só o superadmin cria tenant: ADMIN e USER recebem 403, sem token 401")
    void soOSuperadminCria() throws Exception {
        long antes = tenantRepository.count();

        criar(autenticar(adminA.getEmail()), """
                {"nome":"Tentativa"}
                """).andExpect(status().isForbidden());
        criar(autenticar(userA.getEmail()), """
                {"nome":"Tentativa"}
                """).andExpect(status().isForbidden());
        mockMvc.perform(post("/tenants")
                        .contentType("application/json")
                        .content("""
                                {"nome":"Tentativa"}
                                """))
                .andExpect(status().isUnauthorized());

        assertThat(tenantRepository.count()).isEqualTo(antes);
    }

    @Test
    @DisplayName("só o superadmin cria usuário, nem no tenant recém-criado ADMIN e USER entram")
    void soOSuperadminCriaUsuario() throws Exception {
        UUID tenantNovo = idDe(criar(autenticar(superadmin.getEmail()), """
                {"nome":"Empresa Vazia"}
                """));

        for (String email : new String[]{adminA.getEmail(), userA.getEmail()}) {
            mockMvc.perform(post("/usuarios")
                            .header(AUTHORIZATION, autenticar(email))
                            .contentType("application/json")
                            .content(usuario(tenantNovo, "intruso@nova.local")))
                    .andExpect(status().isForbidden());
        }

        assertThat(usuarioRepository.findByEmailIgnoreCase("intruso@nova.local")).isEmpty();
    }

    @Test
    @DisplayName("ponta a ponta: cria o tenant, depois o usuário nele, e o usuário entra no tenant certo")
    void tenantDepoisUsuario() throws Exception {
        String token = autenticar(superadmin.getEmail());
        UUID tenantNovo = idDe(criar(token, """
                {"nome":"Empresa Passo a Passo","paleta":"CAFE"}
                """));

        mockMvc.perform(post("/usuarios")
                        .header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(usuario(tenantNovo, "primeiro@passo.local")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").value(tenantNovo.toString()))
                .andExpect(jsonPath("$.role").value("USER"));

        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"primeiro@passo.local","senha":"SenhaDoPrimeiro1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(tenantNovo.toString()))
                .andExpect(jsonPath("$.tenantNome").value("Empresa Passo a Passo"))
                .andExpect(jsonPath("$.paleta").value("CAFE"));
    }

    private ResultActions criar(String token, String corpo) throws Exception {
        return mockMvc.perform(post("/tenants")
                .header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(corpo));
    }

    private UUID idDe(ResultActions resposta) throws Exception {
        String corpo = resposta.andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }

    private static String usuario(UUID tenantId, String email) {
        return """
                {"tenantId":"%s","nome":"Primeiro Usuário","email":"%s",
                 "senha":"SenhaDoPrimeiro1","role":"USER"}
                """.formatted(tenantId, email);
    }
}
