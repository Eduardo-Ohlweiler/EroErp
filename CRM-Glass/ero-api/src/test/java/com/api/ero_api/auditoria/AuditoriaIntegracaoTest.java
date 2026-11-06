package com.api.ero_api.auditoria;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

/** Auditoria filtra o tenant À MÃO (EventoSeguranca não é TenantEntity): estes testes protegem isso. */
class AuditoriaIntegracaoTest extends IntegracaoTest {

    @Test
    void caminhoFeliz_adminVeOsEventosDoProprioContratanteComAutor() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        JsonNode pagina = corpo(get("/api/auditoria/eventos?tipo=USUARIO_CRIADO&usuarioId=" + u.id(), c.admin().token()));
        assertThat(pagina.path("totalElementos").asLong()).isEqualTo(1);
        JsonNode evento = pagina.path("conteudo").get(0);
        assertThat(evento.path("usuarioId").asString()).as("afetado").isEqualTo(u.id().toString());
        assertThat(evento.path("autorId").asString()).as("quem criou")
                .isEqualTo(c.admin().corpo().path("usuario").path("id").asString());
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        assertThat(status(get("/api/auditoria/eventos?tipo=NAO_EXISTE", c.admin().token()))).isEqualTo(400);
        assertThat(status(get("/api/auditoria/eventos?sort=detalhe", c.admin().token()))).isEqualTo(422);
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
}
