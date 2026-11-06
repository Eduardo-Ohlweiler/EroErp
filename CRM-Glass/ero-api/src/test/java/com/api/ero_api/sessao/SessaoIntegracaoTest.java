package com.api.ero_api.sessao;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

/** Sessão filtra o dono À MÃO (SessaoUsuario não é TenantEntity): estes testes protegem isso. */
class SessaoIntegracaoTest extends IntegracaoTest {

    @Test
    void caminhoFeliz_listaEEncerraUmaDasMinhasSessoes() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao notebook = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        Sessao celular = login(u.email(), SENHA_FORTE_2);

        JsonNode sessoes = corpo(get("/api/sessoes", notebook.token()));
        assertThat(sessoes.size()).isEqualTo(2);
        String idDoCelular = sessoes.valueStream()
                .filter(n -> !n.path("atual").asBoolean())
                .findFirst().orElseThrow().path("id").asString();

        assertThat(status(patch("/api/sessoes/" + idDoCelular + "/encerrar", notebook.token()))).isEqualTo(204);
        assertThat(status(get("/api/auth/eu", celular.token()))).as("celular caiu").isEqualTo(401);
        assertThat(status(get("/api/auth/eu", notebook.token()))).as("notebook continua").isEqualTo(200);

        JsonNode eventos = corpo(get("/api/auditoria/eventos?tipos=SESSAO_ENCERRADA&usuarioId=" + u.id(), c.admin().token()));
        assertThat(eventos.path("totalElementos").asLong()).isEqualTo(1);
    }

    @Test
    void encerrarOutrasMantemAAtual() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao notebook = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        Sessao celular = login(u.email(), SENHA_FORTE_2);
        Sessao tablet = login(u.email(), SENHA_FORTE_2);
        Sessao outroUsuario = c.admin();

        assertThat(status(patch("/api/sessoes/encerrar-outras", notebook.token()))).isEqualTo(204);
        assertThat(status(get("/api/auth/eu", celular.token()))).as("celular caiu").isEqualTo(401);
        assertThat(status(get("/api/auth/eu", tablet.token()))).as("tablet caiu").isEqualTo(401);
        assertThat(status(refresh(celular.refresh()))).as("nem renova").isEqualTo(401);
        assertThat(status(get("/api/auth/eu", notebook.token()))).as("este navegador continua").isEqualTo(200);
        assertThat(status(get("/api/auth/eu", outroUsuario.token()))).as("sessão de outra pessoa intacta").isEqualTo(200);

        JsonNode sessoes = corpo(get("/api/sessoes", notebook.token()));
        assertThat(sessoes.size()).isEqualTo(1);
        assertThat(sessoes.get(0).path("atual").asBoolean()).isTrue();

        JsonNode eventos = corpo(get("/api/auditoria/eventos?tipos=SESSAO_ENCERRADA&usuarioId=" + u.id(), c.admin().token()));
        assertThat(eventos.path("totalElementos").asLong()).isEqualTo(1);
        assertThat(eventos.path("conteudo").get(0).path("detalhe").asString()).isEqualTo("todas as outras");
    }

    @Test
    void pendenteNaoEncerraOutras() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao pendente = login(u.email(), SENHA_FORTE);
        assertThat(status(patch("/api/sessoes/encerrar-outras", pendente.token()))).isEqualTo(403);
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        assertThat(status(patch("/api/sessoes/nao-e-uuid/encerrar", c.admin().token()))).isEqualTo(400);
    }

    @Test
    void naoEncerraSessaoDeOutroUsuarioNemDeOutroContratante() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado vitima = novoUsuario(a.admin());
        Sessao sessaoVitima = loginTrocandoSenha(vitima.email(), SENHA_FORTE, SENHA_FORTE_2);
        String idSessaoVitima = corpo(get("/api/sessoes", sessaoVitima.token())).get(0).path("id").asString();

        // Mesmo contratante, outro usuário (até o admin).
        assertThat(status(patch("/api/sessoes/" + idSessaoVitima + "/encerrar", a.admin().token()))).isEqualTo(404);
        // Outro contratante.
        assertThat(status(patch("/api/sessoes/" + idSessaoVitima + "/encerrar", b.admin().token()))).isEqualTo(404);
        assertThat(status(get("/api/auth/eu", sessaoVitima.token()))).as("vítima continua logada").isEqualTo(200);

        JsonNode sessoesDoAdmin = corpo(get("/api/sessoes", a.admin().token()));
        assertThat(sessoesDoAdmin.valueStream().map(n -> n.path("id").asString())).doesNotContain(idSessaoVitima);
    }

    @Test
    void pendenteNaoListaSessoes() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao pendente = login(u.email(), SENHA_FORTE);
        assertThat(status(get("/api/sessoes", pendente.token()))).isEqualTo(403);
    }
}
