package com.api.ero_api.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Limite de códigos NOVOS por usuário por hora (produção: 10). Aqui o limite é 3,
 * num contexto próprio: no perfil de teste ele é folgado porque o superadmin entra
 * dezenas de vezes por execução. Quem sabe a senha não consegue derrubar o login do
 * dono da conta pedindo código atrás de código: o 429 vem ANTES de apagar o pendente.
 *
 * <p>Cada teste cria o seu contratante, e isso faz o superadmin entrar: antes de cada
 * teste a cota dele neste banco (que só esta classe usa) é zerada.
 */
@TestPropertySource(properties = "app.seguranca.codigo-max-emissoes-por-hora=3")
class LimiteEmissaoCodigoIntegracaoTest extends IntegracaoTest {

    private static final String MSG_LIMITE = "Muitos códigos pedidos. Tente de novo mais tarde.";
    private static final String LIMITE_ATINGIDO = "CODIGO_LIMITE_ATINGIDO";

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void zerarCotaDoSuperadmin() {
        jdbc.update("DELETE FROM evento_seguranca WHERE tipo = 'CODIGO_ENVIADO' "
                + "AND usuario_id = (SELECT id FROM usuario WHERE email = ?)", SUPERADMIN_EMAIL);
    }

    @Test
    void limiteDeEmissoesPorHora() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());

        // 1º código + 2 reenvios: reenvio não conta no limite.
        String primeiro = desafio(u.email(), SENHA_FORTE);
        for (int i = 0; i < 2; i++) {
            jdbc.update("UPDATE codigo_verificacao SET ultimo_envio_em = ultimo_envio_em - interval '61 seconds' "
                    + "WHERE usuario_id = ?", u.id());
            assertThat(status(reenviarCodigo(primeiro))).as("reenvio %d", i + 1).isEqualTo(200);
        }
        desafio(u.email(), SENHA_FORTE);
        String daVitima = desafio(u.email(), SENHA_FORTE);
        String codigoDaVitima = caixa.ultimoCodigoPara(u.email());
        long emails = caixa.quantosPara(u.email());

        MvcTestResult quarto = tentarLogin(u.email(), SENHA_FORTE);
        assertThat(status(quarto)).as("4º código novo na mesma hora").isEqualTo(429);
        JsonNode erro = corpo(quarto);
        assertThat(erro.path("codigo").asString()).isEqualTo("MUITAS_REQUISICOES");
        assertThat(erro.path("detail").asString()).isEqualTo(MSG_LIMITE);
        assertThat(erro.has("desafioDoisFatores")).isFalse();
        assertThat(Long.parseLong(quarto.getResponse().getHeader("Retry-After")))
                .as("até o 1º código sair da janela de 1 hora").isBetween(3000L, 3600L);
        assertThat(caixa.quantosPara(u.email())).as("nenhum e-mail novo").isEqualTo(emails);
        assertThat(contarCodigos(u.id())).as("o código pendente não foi apagado").isEqualTo(1);

        assertThat(status(verificarCodigo(daVitima, codigoDaVitima))).as("o dono da conta ainda entra").isEqualTo(200);

        // O 1º código sai da janela: abre uma vaga.
        jdbc.update("""
                UPDATE evento_seguranca SET created_at = created_at - interval '61 minutes'
                WHERE id = (SELECT id FROM evento_seguranca WHERE usuario_id = ? AND tipo = 'CODIGO_ENVIADO'
                            ORDER BY created_at LIMIT 1)
                """, u.id());
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("passou 1 hora do 1º").isEqualTo(200);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("e a vaga acabou de novo").isEqualTo(429);
    }

    /** O limite é por usuário: o de um não trava o outro do mesmo contratante. */
    @Test
    void limiteEPorUsuario() {
        Contratante c = novoContratante();
        UsuarioCriado esgotado = novoUsuario(c.admin());
        UsuarioCriado outro = novoUsuario(c.admin());
        for (int i = 0; i < 3; i++) {
            desafio(esgotado.email(), SENHA_FORTE);
        }
        assertThat(status(tentarLogin(esgotado.email(), SENHA_FORTE))).isEqualTo(429);
        assertThat(status(tentarLogin(outro.email(), SENHA_FORTE))).isEqualTo(200);
    }

    /**
     * Logins em paralelo com SMTP lento: a vaga é reservada na transação que trava a
     * linha do usuário, antes do e-mail sair. Sem isso, todos os que chegam enquanto
     * o 1º e-mail está saindo passam pela contagem (este teste fica vermelho).
     */
    @Test
    void loginsEmParaleloNaoFuramOLimite() throws Exception {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        CountDownLatch largada = new CountDownLatch(1);
        Callable<Integer> login = () -> {
            largada.await();
            return status(tentarLogin(u.email(), SENHA_FORTE));
        };
        List<Integer> resultados = new ArrayList<>();
        caixa.atrasarEnvios(Duration.ofMillis(500));
        try (var pool = Executors.newFixedThreadPool(6)) {
            List<Future<Integer>> pedidos = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                pedidos.add(pool.submit(login));
            }
            largada.countDown();
            for (Future<Integer> f : pedidos) {
                resultados.add(f.get(30, TimeUnit.SECONDS));
            }
        } finally {
            caixa.atrasarEnvios(Duration.ZERO);
        }
        assertThat(resultados).as("limite 3 com 6 logins ao mesmo tempo").containsExactlyInAnyOrder(200, 200, 200, 429, 429, 429);
        assertThat(caixa.quantosPara(u.email())).isEqualTo(3);
        assertThat(eventosDeCodigo(u.id())).isEqualTo(3);
        assertThat(eventos(u.id(), LIMITE_ATINGIDO)).as("os 3 barrados passam um de cada vez: um evento só").isEqualTo(1);
    }

    /** E-mail que não saiu (503) devolve a vaga: o SMTP fora do ar não tranca o usuário por 1 hora. */
    @Test
    void envioQueFalhouNaoGastaAVaga() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        caixa.falharEnvios(true);
        try {
            for (int i = 0; i < 4; i++) {
                assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("falha %d", i + 1).isEqualTo(503);
            }
        } finally {
            caixa.falharEnvios(false);
        }
        assertThat(eventosDeCodigo(u.id())).isZero();
        for (int i = 0; i < 3; i++) {
            assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("login %d com o SMTP de volta", i + 1).isEqualTo(200);
        }
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).isEqualTo(429);
    }

    /** O administrador redefine a senha: a cota gasta por quem sabia a senha antiga deixa de valer. */
    @Test
    void redefinirSenhaZeraACota() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        for (int i = 0; i < 3; i++) {
            desafio(u.email(), SENHA_FORTE);
        }
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).isEqualTo(429);

        assertThat(status(patch("/api/usuarios/" + u.id() + "/redefinir-senha", c.admin().token(),
                Map.of("novaSenha", SENHA_FORTE_2)))).isEqualTo(204);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE_2))).as("cota nova depois da troca").isEqualTo(200);
    }

    /**
     * Senha certa barrada pelo limite vai para a trilha: alguém que sabe a senha está
     * insistindo. Um CODIGO_LIMITE_ATINGIDO por janela, por mais 429 que venham, e
     * gravado de fato (a transação do login termina com commit e o 429 sai depois).
     * Senha errada não conta aqui.
     */
    @Test
    void limiteAtingidoVaiParaATrilhaUmaVezPorJanela() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        for (int i = 0; i < 3; i++) {
            desafio(u.email(), SENHA_FORTE);
        }
        assertThat(eventos(u.id(), LIMITE_ATINGIDO)).as("ainda dentro do limite").isZero();
        assertThat(status(tentarLogin(u.email(), "Senha-Errada-Mesmo-2026"))).isEqualTo(401);
        assertThat(eventos(u.id(), LIMITE_ATINGIDO)).as("senha errada não chega no limite").isZero();

        for (int i = 0; i < 3; i++) {
            assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).as("insistência %d", i + 1).isEqualTo(429);
        }
        assertThat(eventos(u.id(), LIMITE_ATINGIDO)).as("um só na janela").isEqualTo(1);
        JsonNode evento = corpo(get("/api/auditoria/eventos?tipos=" + LIMITE_ATINGIDO + "&usuarioId=" + u.id(),
                c.admin().token())).path("conteudo").get(0);
        assertThat(evento.path("tipo").asString()).as("o admin do contratante vê na tela Logs").isEqualTo(LIMITE_ATINGIDO);
        assertThat(evento.path("detalhe").asString()).isEqualTo("limite de 3 códigos por hora");

        // O evento sai da janela e os códigos continuam nela: a próxima insistência registra de novo.
        jdbc.update("UPDATE evento_seguranca SET created_at = created_at - interval '61 minutes' "
                + "WHERE usuario_id = ? AND tipo = ?", u.id(), LIMITE_ATINGIDO);
        assertThat(status(tentarLogin(u.email(), SENHA_FORTE))).isEqualTo(429);
        assertThat(eventos(u.id(), LIMITE_ATINGIDO)).isEqualTo(2);
    }

    private long contarCodigos(UUID usuarioId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM codigo_verificacao WHERE usuario_id = ?", Long.class, usuarioId);
    }

    private long eventosDeCodigo(UUID usuarioId) {
        return eventos(usuarioId, "CODIGO_ENVIADO");
    }

    private long eventos(UUID usuarioId, String tipo) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM evento_seguranca WHERE usuario_id = ? AND tipo = ?",
                Long.class, usuarioId, tipo);
    }
}
