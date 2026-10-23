package com.api.ero_erp.auth;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.usuario.entity.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Autenticação")
class AuthTest extends AbstractIntegrationTest {

    // ─────────────────────────────────────────────────────────────────
    //  Superfície pública
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("não existe rota pública de registro e nenhum tenant nasce por ela")
    void naoExisteRotaPublicaDeRegistro() throws Exception {
        long tenantsAntes = tenantRepository.count();
        long usuariosAntes = usuarioRepository.count();

        mockMvc.perform(post("/auth/register")
                        .contentType("application/json")
                        .content("""
                                {"nomeTenant":"Consultorio Pirata","nome":"Maria",
                                 "email":"maria@pirata.local","senha":"SenhaForte123"}
                                """))
                .andExpect(status().isUnauthorized());

        assertThat(tenantRepository.count()).isEqualTo(tenantsAntes);
        assertThat(usuarioRepository.count()).isEqualTo(usuariosAntes);
        assertThat(usuarioRepository.findByEmailIgnoreCase("maria@pirata.local")).isEmpty();
    }

    @Test
    @DisplayName("rota inexistente devolve 404, não 500")
    void rotaInexistenteDevolve404() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("método errado devolve 405, não 500")
    void metodoErradoDevolve405() throws Exception {
        mockMvc.perform(get("/auth/login"))
                .andExpect(status().isMethodNotAllowed());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Login
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("usuário inexistente e senha errada devolvem a MESMA mensagem")
    void mensagemDeFalhaNaoRevelaSeOEmailExiste() throws Exception {
        String comEmailReal = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"senhaErrada123"}
                                """.formatted(adminA.getEmail())))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String comEmailFalso = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"nao.existe@teste.local","senha":"senhaErrada123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(comEmailReal).get("erro").asText())
                .isEqualTo(objectMapper.readTree(comEmailFalso).get("erro").asText());
    }

    @Test
    @DisplayName("usuário inativo não entra")
    void usuarioInativoNaoEntra() throws Exception {
        adminA.setAtivo(false);
        usuarioRepository.save(adminA);

        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("tenant inativo bloqueia todos os seus usuários")
    void tenantInativoBloqueiaOsUsuarios() throws Exception {
        tenantA.setAtivo(false);
        tenantRepository.save(tenantA);

        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────
    //  A ordem do login — nada de oráculo de conta (OWASP A07)
    // ─────────────────────────────────────────────────────────────────

    /**
     * A frase "usuário inativo" só sai para quem acertou a senha: antes dela,
     * dizia a quem chutava que o e-mail existe e está desligado.
     */
    @Test
    @DisplayName("inativo com senha errada recebe a frase genérica")
    void inativoComSenhaErradaRecebeFraseGenerica() throws Exception {
        adminA.setAtivo(false);
        usuarioRepository.save(adminA);

        assertThat(erroDoLogin(adminA.getEmail(), "senhaErrada123"))
                .isEqualTo(erroDoLogin("nao.existe@teste.local", "senhaErrada123"))
                .isEqualTo("E-mail ou senha inválidos");
    }

    @Test
    @DisplayName("tenant inativo com senha errada recebe a frase genérica")
    void tenantInativoComSenhaErradaRecebeFraseGenerica() throws Exception {
        tenantA.setAtivo(false);
        tenantRepository.save(tenantA);

        assertThat(erroDoLogin(adminA.getEmail(), "senhaErrada123"))
                .isEqualTo("E-mail ou senha inválidos");
    }

    @Test
    @DisplayName("inativo com a senha certa recebe a frase específica")
    void inativoComSenhaCertaRecebeFraseEspecifica() throws Exception {
        adminA.setAtivo(false);
        usuarioRepository.save(adminA);

        assertThat(erroDoLogin(adminA.getEmail(), SENHA_PADRAO))
                .isEqualTo("Usuário inativo. Contate o administrador.");

        tenantB.setAtivo(false);
        tenantRepository.save(tenantB);

        assertThat(erroDoLogin(adminB.getEmail(), SENHA_PADRAO))
                .isEqualTo("Acesso bloqueado. Contate o administrador.");
    }

    /**
     * O bloqueio fica ANTES da senha: se ficasse depois, a senha certa daria
     * outra frase durante o bloqueio — e o bloqueio viraria um oráculo.
     */
    @Test
    @DisplayName("conta bloqueada dá o mesmo erro com a senha certa e com a errada")
    void bloqueadoNaoViraOraculoDeSenha() throws Exception {
        Usuario bloqueado = usuarioRepository.findById(adminA.getId()).orElseThrow();
        bloqueado.setTentativasFalhas(5);
        bloqueado.setBloqueadoAte(Instant.now().plus(15, ChronoUnit.MINUTES));
        usuarioRepository.save(bloqueado);

        assertThat(erroDoLogin(adminA.getEmail(), SENHA_PADRAO))
                .isEqualTo(erroDoLogin(adminA.getEmail(), "senhaErrada123"))
                .startsWith("Conta temporariamente bloqueada");
    }

    /**
     * O X-Forwarded-For é do cliente, e o cliente escreve o que quiser nele:
     * o IP do log vem da conexão. Em produção o proxy da mesma máquina põe o
     * IP real, e o Tomcat (forward-headers-strategy: native, só de proxy
     * interno) o promove a remoteAddr antes de chegar aqui.
     */
    @Test
    @DisplayName("o IP do log de acesso vem da conexão, não do X-Forwarded-For")
    void ipDoLogVemDaConexao() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .header("X-Forwarded-For", "203.0.113.7")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isOk());

        assertThat(loginLogRepository.findAll())
                .singleElement()
                .extracting(l -> l.getEnderecoIp())
                .isEqualTo("127.0.0.1");
    }

    // ─────────────────────────────────────────────────────────────────
    //  Bloqueio por tentativas — OWASP A07
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cinco senhas erradas bloqueiam a conta, e a senha certa deixa de valer")
    void bloqueiaAposCincoTentativas() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/auth/login")
                            .contentType("application/json")
                            .content("""
                                    {"email":"%s","senha":"senhaErrada123"}
                                    """.formatted(adminA.getEmail())))
                    .andExpect(status().isUnauthorized());
        }

        Usuario apos = usuarioRepository.findById(adminA.getId()).orElseThrow();
        assertThat(apos.getTentativasFalhas()).isEqualTo(5);
        assertThat(apos.estaBloqueado())
                .as("o contador precisa sobreviver ao rollback do login que falhou")
                .isTrue();

        // Mesmo com a senha correta, a conta está bloqueada
        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("login válido zera o contador de tentativas")
    void loginValidoZeraOContador() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"senhaErrada123"}
                                """.formatted(adminA.getEmail())))
                .andExpect(status().isUnauthorized());

        assertThat(usuarioRepository.findById(adminA.getId()).orElseThrow()
                .getTentativasFalhas()).isEqualTo(1);

        autenticar(adminA.getEmail());

        assertThat(usuarioRepository.findById(adminA.getId()).orElseThrow()
                .getTentativasFalhas()).isZero();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Refresh token
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh rotaciona o par e invalida o token usado")
    void refreshRotacionaEInvalidaOAnterior() throws Exception {
        String primeiro = refreshTokenDeLogin(adminA.getEmail());
        String segundo = objectMapper.readTree(chamarRefresh(primeiro, 200))
                .get("refreshToken").asText();

        assertThat(segundo).isNotEqualTo(primeiro);
        chamarRefresh(primeiro, 401);
    }

    @Test
    @DisplayName("reapresentar token usado há mais de 10 s derruba a cadeia inteira")
    void reusoDerrubaACadeia() throws Exception {
        String primeiro = refreshTokenDeLogin(adminA.getEmail());
        String segundo = objectMapper.readTree(chamarRefresh(primeiro, 200))
                .get("refreshToken").asText();
        envelhecerRevogados(Duration.ofSeconds(11));    // fora da tolerância entre abas

        String corpo = chamarRefresh(primeiro, 401);       // reuso detectado
        assertThat(objectMapper.readTree(corpo).has("motivo"))
                .as("fora da janela é o reuso de sempre, sem a marca da outra aba")
                .isFalse();

        // O token novo também precisa cair — a revogação não pode ser desfeita
        // pelo rollback da exceção lançada acima.
        chamarRefresh(segundo, 401);
    }

    /**
     * Duas abas renovando juntas: a trava do navegador serializa, mas a
     * segunda às vezes lê o localStorage de antes e apresenta o refresh que a
     * primeira acabou de girar. Dentro de 10 s isso é a outra aba, não roubo:
     * 401 com a marca, nada emitido, e a cadeia — o sucessor — segue valendo.
     */
    @Test
    @DisplayName("reuso logo após a rotação: 401 com a marca, nada emitido, e o sucessor continua valendo")
    void reusoImediatoNaoDerrubaACadeia() throws Exception {
        String primeiro = refreshTokenDeLogin(adminA.getEmail());
        String segundo = objectMapper.readTree(chamarRefresh(primeiro, 200))
                .get("refreshToken").asText();
        long tokensAntes = refreshTokenRepository.count();

        String corpo = chamarRefresh(primeiro, 401);
        assertThat(objectMapper.readTree(corpo).path("motivo").asText()).isEqualTo("SESSAO_RENOVADA_EM_OUTRA_ABA");
        assertThat(objectMapper.readTree(corpo).path("erro").asText()).isEqualTo("Sessão renovada em outra aba");
        assertThat(refreshTokenRepository.count()).as("nenhum token emitido").isEqualTo(tokensAntes);

        chamarRefresh(segundo, 200);
    }

    /**
     * O logout grava o mesmo revogado_em: reapresentar logo depois cai na
     * janela e recebe a marca — mas nada é emitido e a cadeia já está toda
     * revogada, então a sessão não volta.
     */
    @Test
    @DisplayName("reuso logo após o logout: 401, nada emitido, e todos os tokens continuam revogados")
    void reusoAposLogoutNaoReabreASessao() throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String access = "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
        String refresh = objectMapper.readTree(corpo).get("refreshToken").asText();
        mockMvc.perform(post("/auth/logout").header(AUTHORIZATION, access))
                .andExpect(status().isNoContent());
        long tokensAntes = refreshTokenRepository.count();

        chamarRefresh(refresh, 401);
        chamarRefresh(refresh, 401);

        assertThat(refreshTokenRepository.count()).isEqualTo(tokensAntes);
        assertThat(refreshTokenRepository.findAll()).allMatch(t -> t.getRevogadoEm() != null);
    }

    @Test
    @DisplayName("logout revoga os refresh tokens do usuário")
    void logoutRevogaOsRefreshTokens() throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(adminA.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String access = "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
        String refresh = objectMapper.readTree(corpo).get("refreshToken").asText();

        mockMvc.perform(post("/auth/logout").header(AUTHORIZATION, access))
                .andExpect(status().isNoContent());

        chamarRefresh(refresh, 401);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Troca de tenant
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ADMIN não consegue trocar de tenant")
    void adminNaoTrocaDeTenant() throws Exception {
        mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId())
                        .header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("USER não consegue trocar de tenant")
    void userNaoTrocaDeTenant() throws Exception {
        mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId())
                        .header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("superadmin troca de tenant e volta")
    void superadminTrocaEVolta() throws Exception {
        String raiz = autenticar(superadmin.getEmail());

        String noTenantB = mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId())
                        .header(AUTHORIZATION, raiz))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(tenantB.getId().toString()))
                .andExpect(jsonPath("$.impersonating").value(true))
                .andReturn().getResponse().getContentAsString();

        String tokenB = "Bearer " + objectMapper.readTree(noTenantB).get("accessToken").asText();

        mockMvc.perform(post("/auth/exit-tenant").header(AUTHORIZATION, tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(superadmin.getTenant().getId().toString()))
                .andExpect(jsonPath("$.impersonating").value(false));
    }

    /**
     * Contrato com o front (api.ts): o refresh pertence ao tenant de ORIGEM.
     * Renovar a sessão no meio de uma troca devolve o superadmin ao tenant
     * dele, sem impersonação — o front compara o tenantId da resposta com o de
     * antes e não repete a requisição em outro cliente.
     */
    @Test
    @DisplayName("refresh durante a troca de tenant devolve o tenant de origem")
    void refreshDuranteTrocaDevolveOTenantDeOrigem() throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(superadmin.getEmail(), SENHA_PADRAO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String access = "Bearer " + objectMapper.readTree(corpo).get("accessToken").asText();
        String refresh = objectMapper.readTree(corpo).get("refreshToken").asText();

        mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId()).header(AUTHORIZATION, access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(tenantB.getId().toString()))
                .andExpect(jsonPath("$.refreshToken").doesNotExist());

        mockMvc.perform(post("/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refresh)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(superadmin.getTenant().getId().toString()))
                .andExpect(jsonPath("$.impersonating").value(false));
    }

    @Test
    @DisplayName("não é possível entrar em tenant inativo")
    void naoEntraEmTenantInativo() throws Exception {
        tenantB.setAtivo(false);
        tenantRepository.save(tenantB);

        mockMvc.perform(post("/auth/switch-tenant/{id}", tenantB.getId())
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isConflict());
    }

    // ─────────────────────────────────────────────────────────────────

    /** A frase do 401 de um login que falha. */
    private String erroDoLogin(String email, String senha) throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, senha)))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(corpo).get("erro").asText();
    }

    /** Recua o revogado_em dos tokens já revogados — simula o tempo passando. */
    private void envelhecerRevogados(Duration quanto) {
        refreshTokenRepository.findAll().stream()
                .filter(t -> t.getRevogadoEm() != null)
                .forEach(t -> {
                    t.setRevogadoEm(t.getRevogadoEm().minus(quanto));
                    refreshTokenRepository.save(t);
                });
    }

    private String refreshTokenDeLogin(String email) throws Exception {
        String corpo = mockMvc.perform(post("/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, SENHA_PADRAO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(corpo).get("refreshToken").asText();
    }

    private String chamarRefresh(String refreshToken, int statusEsperado) throws Exception {
        return mockMvc.perform(post("/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refreshToken)))
                .andExpect(status().is(statusEsperado))
                .andReturn().getResponse().getContentAsString();
    }
}
