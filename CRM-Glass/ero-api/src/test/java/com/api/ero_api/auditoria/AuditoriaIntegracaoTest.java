package com.api.ero_api.auditoria;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auditoria.service.RetencaoEventoService;
import com.api.ero_api.support.IntegracaoTest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/** Auditoria filtra o tenant À MÃO (EventoSeguranca não é TenantEntity): estes testes protegem isso. */
class AuditoriaIntegracaoTest extends IntegracaoTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private RetencaoEventoService retencao;

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_adminVeOsEventosDoProprioContratanteComAutorENomes() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        JsonNode pagina = corpo(get("/api/auditoria/eventos?tipos=USUARIO_CRIADO&usuarioId=" + u.id(), c.admin().token()));
        assertThat(pagina.path("totalElementos").asLong()).isEqualTo(1);
        JsonNode evento = pagina.path("conteudo").get(0);
        assertThat(evento.path("usuarioId").asString()).as("afetado").isEqualTo(u.id().toString());
        assertThat(evento.path("usuarioNome").asString()).isEqualTo("Bruno Rocha");
        assertThat(evento.path("autorId").asString()).as("quem criou")
                .isEqualTo(c.admin().corpo().path("usuario").path("id").asString());
        assertThat(evento.path("autorNome").asString()).isEqualTo("Ana Lima");
        assertThat(evento.path("tenantNome").isNull()).as("nome do contratante só na plataforma").isTrue();
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        assertThat(status(get("/api/auditoria/eventos?tipos=NAO_EXISTE", token))).isEqualTo(400);
        assertThat(status(get("/api/auditoria/eventos?sort=detalhe", token))).isEqualTo(422);
        assertThat(status(get("/api/auditoria/eventos?de=ontem", token))).isEqualTo(400);

        Instant agora = Instant.now();
        MvcTestResult invertido = get("/api/auditoria/eventos?de=" + agora + "&ate=" + agora.minusSeconds(60), token);
        assertThat(status(invertido)).isEqualTo(422);
        assertThat(corpo(invertido).path("detail").asString()).isEqualTo("Período inválido.");

        MvcTestResult longo = get("/api/auditoria/eventos?de=" + agora.minus(Duration.ofDays(400)) + "&ate=" + agora, token);
        assertThat(status(longo)).isEqualTo(422);
        assertThat(corpo(longo).path("detail").asString()).isEqualTo("Escolha um período de até 1 ano.");
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado deA = novoUsuario(a.admin());

        JsonNode vistoPorB = corpo(get("/api/auditoria/eventos?usuarioId=" + deA.id(), b.admin().token()));
        assertThat(vistoPorB.path("totalElementos").asLong()).isZero();

        JsonNode tudoDeB = corpo(get("/api/auditoria/eventos?size=100", b.admin().token()));
        assertThat(tudoDeB.path("conteudo").valueStream().map(e -> e.path("tenantId").asString()))
                .allMatch(t -> t.equals(b.id().toString()));

        // tenantId forjado por quem não é a plataforma é ignorado.
        JsonNode forjado = corpo(get("/api/auditoria/eventos?size=100&tenantId=" + a.id(), b.admin().token()));
        assertThat(forjado.path("totalElementos").asLong()).isPositive();
        assertThat(forjado.path("conteudo").valueStream().map(e -> e.path("tenantId").asString()))
                .allMatch(t -> t.equals(b.id().toString()));
        assertThat(corpo(get("/api/auditoria/eventos?usuarioId=" + deA.id() + "&tenantId=" + a.id(), b.admin().token()))
                .path("totalElementos").asLong()).isZero();

        // Superadmin na visão de plataforma enxerga os dois.
        JsonNode plataforma = corpo(get("/api/auditoria/eventos?usuarioId=" + deA.id(), loginSuperadmin().token()));
        assertThat(plataforma.path("totalElementos").asLong()).isPositive();
    }

    @Test
    void parLer() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get("/api/auditoria/eventos", comum.token()))).isEqualTo(403);
        liberar(c.admin().token(), u.id(), List.of(grupo("AUDITORIA", "LER")), Set.of());
        assertThat(status(get("/api/auditoria/eventos", comum.token()))).isEqualTo(200);
    }

    // ------------------------------------------------------------ regras

    @Test
    void superadminNaPlataformaFiltraPorContratanteEVeOsNomes() {
        Contratante a = novoContratante();
        novoContratante();
        UsuarioCriado deA = novoUsuario(a.admin());
        Sessao s = loginSuperadmin();
        String nomeA = corpo(get("/api/tenants/" + a.id(), s.token())).path("nome").asString();

        JsonNode soA = corpo(get("/api/auditoria/eventos?size=100&tenantId=" + a.id(), s.token()));
        assertThat(soA.path("totalElementos").asLong()).isPositive();
        assertThat(soA.path("conteudo").valueStream().map(e -> e.path("tenantId").asString()))
                .allMatch(t -> t.equals(a.id().toString()));
        assertThat(soA.path("conteudo").valueStream().map(e -> e.path("tenantNome").asString()))
                .allMatch(n -> n.equals(nomeA));

        JsonNode criado = corpo(get("/api/auditoria/eventos?tipos=USUARIO_CRIADO&usuarioId=" + deA.id(), s.token()))
                .path("conteudo").get(0);
        assertThat(criado.path("usuarioNome").asString()).isEqualTo("Bruno Rocha");
        assertThat(criado.path("autorNome").asString()).isEqualTo("Ana Lima");
    }

    @Test
    void autorSuperadminVistoDeDentroDoContratanteSaiSemNome() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        String superadminId = s.corpo().path("usuario").path("id").asString();
        String dentro = corpo(post("/api/auth/superadmin/acessar/" + c.id(), s.token(), Map.of())).path("tokenAcesso").asString();
        MvcTestResult r = post("/api/usuarios", dentro, Map.of(
                "nome", "Criado Pelo Suporte", "email", unico("suporte") + "@teste.local", "senha", SENHA_FORTE, "papel", "USUARIO"));
        assertThat(status(r)).isEqualTo(201);
        String criadoId = corpo(r).path("id").asString();

        JsonNode visto = corpo(get("/api/auditoria/eventos?tipos=USUARIO_CRIADO&usuarioId=" + criadoId, c.admin().token()))
                .path("conteudo").get(0);
        assertThat(visto.path("autorId").asString()).isEqualTo(superadminId);
        assertThat(visto.path("autorNome").isNull()).as("front mostra \"Suporte da plataforma\"").isTrue();
        assertThat(visto.path("usuarioNome").asString()).isEqualTo("Criado Pelo Suporte");

        JsonNode naPlataforma = corpo(get("/api/auditoria/eventos?tipos=USUARIO_CRIADO&usuarioId=" + criadoId,
                loginSuperadmin().token())).path("conteudo").get(0);
        assertThat(naPlataforma.path("autorNome").asString()).isEqualTo("Superadmin Teste");
    }

    @Test
    void periodoPadraoDeSeteDiasEVariosTipos() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        String token = c.admin().token();
        String filtro = "/api/auditoria/eventos?tipos=USUARIO_CRIADO&usuarioId=" + u.id();
        String eventoId = corpo(get(filtro, token)).path("conteudo").get(0).path("id").asString();

        jdbc.update("UPDATE evento_seguranca SET created_at = now() - interval '10 days' WHERE id = ?", UUID.fromString(eventoId));
        assertThat(corpo(get(filtro, token)).path("totalElementos").asLong()).as("fora dos 7 dias").isZero();
        Instant de = Instant.now().minus(Duration.ofDays(30));
        assertThat(corpo(get(filtro + "&de=" + de, token)).path("totalElementos").asLong()).isEqualTo(1);

        loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        JsonNode dois = corpo(get("/api/auditoria/eventos?tipos=USUARIO_CRIADO,LOGIN_SUCESSO&usuarioId=" + u.id() + "&de=" + de, token));
        assertThat(dois.path("conteudo").valueStream().map(e -> e.path("tipo").asString()))
                .contains("USUARIO_CRIADO", "LOGIN_SUCESSO")
                .allMatch(t -> t.equals("USUARIO_CRIADO") || t.equals("LOGIN_SUCESSO"));
    }

    @Test
    void retencaoApagaEventosDeMaisDeUmAnoESessoesVencidas() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        String token = c.admin().token();
        Instant de = Instant.now().minus(Duration.ofDays(365));

        List<UUID> ids = corpo(get("/api/auditoria/eventos?size=100&usuarioId=" + u.id(), token)).path("conteudo").valueStream()
                .map(e -> UUID.fromString(e.path("id").asString())).toList();
        assertThat(ids).hasSizeGreaterThanOrEqualTo(2);
        UUID antigo = ids.get(0);
        UUID dentroDoPrazo = ids.get(1);
        jdbc.update("UPDATE evento_seguranca SET created_at = now() - interval '400 days' WHERE id = ?", antigo);
        jdbc.update("UPDATE evento_seguranca SET created_at = now() - interval '300 days' WHERE id = ?", dentroDoPrazo);

        UUID sessaoId = UUID.fromString(corpo(get("/api/sessoes", s.token())).get(0).path("id").asString());
        jdbc.update("UPDATE sessao_usuario SET expira_em = now() - interval '1 minute' WHERE id = ?", sessaoId);

        retencao.limpar();

        assertThat(contar("SELECT COUNT(*) FROM evento_seguranca WHERE id = ?", antigo)).as("passou de 12 meses").isZero();
        assertThat(contar("SELECT COUNT(*) FROM evento_seguranca WHERE id = ?", dentroDoPrazo)).isEqualTo(1);
        assertThat(corpo(get("/api/auditoria/eventos?size=100&usuarioId=" + u.id() + "&de=" + de, token))
                .path("conteudo").valueStream().map(e -> e.path("id").asString()))
                .doesNotContain(antigo.toString()).contains(dentroDoPrazo.toString());
        assertThat(contar("SELECT COUNT(*) FROM sessao_usuario WHERE id = ?", sessaoId)).as("sessão vencida").isZero();
        assertThat(contar("SELECT COUNT(*) FROM refresh_token WHERE sessao_id = ?", sessaoId)).isZero();
        assertThat(status(get("/api/auth/eu", token))).as("sessão válida de outro usuário fica").isEqualTo(200);
    }

    private long contar(String sql, UUID id) {
        return jdbc.queryForObject(sql, Long.class, id);
    }
}
