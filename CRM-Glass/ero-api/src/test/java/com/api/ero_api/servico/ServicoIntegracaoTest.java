package com.api.ero_api.servico;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.support.IntegracaoTest;
import jakarta.persistence.EntityManagerFactory;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import java.util.stream.LongStream;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Serviços: os 4 obrigatórios, o código por contratante, as regras da lista de filiais
 * (onde o serviço é prestado, com o preço opcional de cada uma), da categoria e da versão,
 * a lista com filtros (inclusive por filial) sem N+1, o combo sem preço e as restrições do
 * banco. Cada teste usa um contratante novo: código e nome são por contratante.
 */
class ServicoIntegracaoTest extends IntegracaoTest {

    private static final String ROTA = "/api/servicos";
    private static final String CATEGORIAS = "/api/categorias-servico";
    private static final String MSG_PELO_MENOS_UMA = "Informe pelo menos uma filial onde o serviço é prestado.";

    @Autowired
    private EntityManagerFactory emf;

    @Autowired
    private JdbcTemplate jdbc;

    /** Id do tipo de cadastro CLIENTE por token (toda pessoa nasce com um tipo). */
    private final Map<String, String> clientePorToken = new HashMap<>();

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String nomeCategoria = unico("Instalação");
        JsonNode categoria = categoria(token, nomeCategoria);
        JsonNode f1 = filial(token, unico("Centro"));
        JsonNode f2 = filial(token, unico("Norte"));
        String idF1 = f1.path("id").asString();
        String idF2 = f2.path("id").asString();

        String nome = unico("Instalação de ar");
        JsonNode s = criar(token, servico(nome, categoria.path("id").asString(), 90, "  Com suporte.  ",
                List.of(valor(idF2, null), valor(idF1, new BigDecimal("150.00")))));
        String id = s.path("id").asString();
        assertThat(s.path("codServico").asLong()).isEqualTo(1);
        assertThat(s.path("nome").asString()).isEqualTo(nome);
        assertThat(s.path("categoria").path("id").asString()).isEqualTo(categoria.path("id").asString());
        assertThat(s.path("categoria").path("nome").asString()).isEqualTo(nomeCategoria);
        assertThat(s.path("categoria").path("ativo").asBoolean()).isTrue();
        assertThat(s.path("duracaoMinutos").asInt()).isEqualTo(90);
        assertThat(s.path("descricao").asString()).as("sem sobra nas pontas").isEqualTo("Com suporte.");
        assertThat(s.path("ativo").asBoolean()).isTrue();
        assertThat(s.path("criadoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(s.has("valor")).as("sem preço no serviço: só por filial").isFalse();

        JsonNode valores = s.path("valores");
        assertThat(valores.size()).isEqualTo(2);
        assertThat(valores.get(0).path("filial").path("id").asString()).as("por código da filial").isEqualTo(idF1);
        assertThat(valores.get(0).path("filial").path("codFilial").asLong()).isEqualTo(f1.path("codFilial").asLong());
        assertThat(valores.get(0).path("filial").path("nome").asString()).isEqualTo(f1.path("pessoa").path("nome").asString());
        assertThat(valores.get(0).path("filial").path("cor").asString()).isEqualTo("#3B82F6");
        assertThat(valores.get(0).path("valor").decimalValue()).isEqualByComparingTo("150.00");
        assertThat(valores.get(0).path("filialAtiva").asBoolean()).isTrue();
        assertThat(valores.get(1).path("filial").path("id").asString()).isEqualTo(idF2);
        assertThat(valores.get(1).path("valor").isNull()).as("preço vazio fica não informado").isTrue();

        assertThat(ids(get(ROTA, token))).containsExactly(id);
        assertThat(corpo(get(ROTA + "/" + id, token)).path("valores").size()).isEqualTo(2);

        // PUT troca as filiais: a lista é o estado completo e substitui a anterior.
        JsonNode f3 = filial(token, unico("Sul"));
        String idF3 = f3.path("id").asString();
        MvcTestResult alterado = put(ROTA + "/" + id, token, versao(servico(nome + " X", null, null, null,
                List.of(valor(idF3, BigDecimal.ZERO), valor(idF1, new BigDecimal("120.5")))), s));
        assertThat(status(alterado)).as(texto(alterado)).isEqualTo(200);
        JsonNode al = corpo(alterado);
        assertThat(al.path("nome").asString()).isEqualTo(nome + " X");
        assertThat(al.path("categoria").isNull()).isTrue();
        assertThat(al.path("duracaoMinutos").isNull()).isTrue();
        assertThat(al.path("descricao").isNull()).isTrue();
        assertThat(al.path("codServico").asLong()).isEqualTo(1);
        assertThat(al.path("version").asLong()).isGreaterThan(s.path("version").asLong());
        assertThat(al.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(filiaisDe(al)).containsExactly(idF1, idF3);
        assertThat(al.path("valores").get(0).path("valor").decimalValue()).isEqualByComparingTo("120.50");
        assertThat(al.path("valores").get(1).path("valor").decimalValue()).isEqualByComparingTo("0");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM servico_filial WHERE servico_id = ?", Long.class,
                UUID.fromString(id))).as("a linha da filial que saiu foi apagada").isEqualTo(2);
        assertThat(filiaisDe(corpo(get(ROTA + "/" + id, token)))).containsExactly(idF1, idF3);

        assertThat(status(patch(ROTA + "/" + id + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", token))).as("já inativo").isEqualTo(204);
        assertThat(corpo(get(ROTA + "/" + id, token)).path("ativo").asBoolean()).isFalse();
        assertThat(ids(get(ROTA + "?ativo=true", token))).isEmpty();
        assertThat(status(patch(ROTA + "/" + id + "/ativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", token))).as("já ativo").isEqualTo(204);
        assertThat(corpo(get(ROTA + "/" + id, token)).path("ativo").asBoolean()).isTrue();
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("Valida")).path("id").asString();
        List<Map<String, Object>> umaFilial = List.of(valor(f, null));

        assertThat(campos(post(ROTA, token, Map.of()))).containsExactlyInAnyOrder("nome", "valores");
        assertThat(campos(post(ROTA, token, servico("", null, null, null, umaFilial)))).containsExactly("nome");
        assertThat(campos(post(ROTA, token, servico("   ", null, null, null, umaFilial)))).containsExactly("nome");
        assertThat(campos(post(ROTA, token, servico("A".repeat(151), null, null, null, umaFilial))))
                .containsExactly("nome");
        assertThat(campos(post(ROTA, token, servico(unico("Dur"), null, 0, null, umaFilial))))
                .containsExactly("duracaoMinutos");
        assertThat(mensagem(post(ROTA, token, servico(unico("Dur"), null, 1441, null, umaFilial))))
                .isEqualTo("Duração deve ser de 1 a 1440 minutos");
        assertThat(campos(post(ROTA, token, servico(unico("Desc"), null, null, "d".repeat(2001), umaFilial))))
                .containsExactly("descricao");

        // Preço: piso 0 e teto de 13 dígitos com 2 casas.
        assertThat(campos(post(ROTA, token, servico(unico("Neg"), null, null, null,
                List.of(valor(f, new BigDecimal("-1"))))))).containsExactly("valores[0].valor");
        assertThat(mensagem(post(ROTA, token, servico(unico("Neg"), null, null, null,
                List.of(valor(f, new BigDecimal("-0.01"))))))).isEqualTo("Preço não pode ser negativo");
        assertThat(campos(post(ROTA, token, servico(unico("Casas"), null, null, null,
                List.of(valor(f, new BigDecimal("1.234"))))))).containsExactly("valores[0].valor");
        assertThat(campos(post(ROTA, token, servico(unico("Teto"), null, null, null,
                List.of(valor(f, new BigDecimal("10000000000000.00"))))))).containsExactly("valores[0].valor");
        assertThat(campos(post(ROTA, token, servico(unico("Sem filial"), null, null, null,
                List.of(valor(null, BigDecimal.TEN)))))).containsExactly("valores[0].filialId");

        // A lista: ausente, vazia e acima de 100 linhas.
        Map<String, Object> semValores = servico(unico("Sem"), null, null, null, null);
        assertThat(campos(post(ROTA, token, semValores))).containsExactly("valores");
        assertThat(mensagem(post(ROTA, token, semValores))).isEqualTo(MSG_PELO_MENOS_UMA);
        MvcTestResult vazia = post(ROTA, token, servico(unico("Vazia"), null, null, null, List.of()));
        assertThat(campos(vazia)).containsExactly("valores");
        assertThat(mensagem(vazia)).isEqualTo(MSG_PELO_MENOS_UMA);
        List<Map<String, Object>> centoEUma = IntStream.range(0, 101)
                .mapToObj(i -> valor(UUID.randomUUID().toString(), null)).toList();
        MvcTestResult demais = post(ROTA, token, servico(unico("Demais"), null, null, null, centoEUma));
        assertThat(campos(demais)).containsExactly("valores");
        assertThat(mensagem(demais)).isEqualTo("No máximo 100 filiais");

        // Os limites cabem.
        JsonNode limite = criar(token, servico(unico("Lim").substring(0, 12) + "B".repeat(138), null, 1440,
                "d".repeat(2000), List.of(valor(f, new BigDecimal("9999999999999.99")))));
        assertThat(limite.path("nome").asString()).hasSize(150);
        assertThat(limite.path("valores").get(0).path("valor").decimalValue()).isEqualByComparingTo("9999999999999.99");
        assertThat(criar(token, servico(unico("Um"), null, 1, null, umaFilial)).path("duracaoMinutos").asInt()).isEqualTo(1);

        // PUT: sem versão e sem a lista (não apaga as filiais em silêncio).
        String id = limite.path("id").asString();
        assertThat(campos(put(ROTA + "/" + id, token, servico(unico("X"), null, null, null, umaFilial))))
                .containsExactly("version");
        assertThat(campos(put(ROTA + "/" + id, token, versao(servico(unico("X"), null, null, null, null), limite))))
                .containsExactly("valores");
        assertThat(campos(put(ROTA + "/" + id, token, versao(servico(unico("X"), null, null, null, List.of()), limite))))
                .containsExactly("valores");
        assertThat(corpo(get(ROTA + "/" + id, token)).path("valores").size()).isEqualTo(1);

        // Parâmetros da lista e do combo.
        assertThat(campos(get(ROTA + "?busca=" + "a".repeat(151), token))).containsExactly("busca");
        assertThat(campos(get(ROTA + "?codServico=0", token))).containsExactly("codServico");
        assertThat(campos(get(ROTA + "/selecao?busca=" + "a".repeat(151), token))).containsExactly("busca");
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        String tokenB = cb.admin().token();
        String filialA = filial(tokenA, unico("FA")).path("id").asString();
        String categoriaA = categoria(tokenA, unico("CatA")).path("id").asString();
        String nome = unico("DeA");
        JsonNode deA = criar(tokenA, servico(nome, categoriaA, 30, null, List.of(valor(filialA, BigDecimal.ONE))));
        String id = deA.path("id").asString();
        String filialB = filial(tokenB, unico("FB")).path("id").asString();

        assertThat(ids(get(ROTA + "?busca=" + nome, tokenB))).isEmpty();
        assertThat(ids(get(ROTA, tokenB))).isEmpty();
        assertThat(ids(get(ROTA + "?filialId=" + filialA, tokenB))).isEmpty();
        assertThat(ids(get(ROTA + "?categoriaId=" + categoriaA, tokenB))).isEmpty();
        assertThat(ids(get(ROTA + "/selecao?busca=" + nome, tokenB))).isEmpty();
        assertThat(status(get(ROTA + "/" + id, tokenB))).isEqualTo(404);
        assertThat(status(put(ROTA + "/" + id, tokenB,
                versao(servico("Invasor", null, null, null, List.of(valor(filialB, null))), deA)))).isEqualTo(404);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", tokenB))).isEqualTo(404);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", tokenB))).isEqualTo(404);

        // Filial e categoria de outro contratante: 400 no campo, como se não existissem, num 400 só.
        MvcTestResult deOutro = post(ROTA, tokenB, servico(unico("Invasor"), categoriaA, null, null,
                List.of(valor(filialB, null), valor(filialA, null))));
        assertThat(status(deOutro)).isEqualTo(400);
        assertThat(erros(deOutro)).containsExactly(
                Map.entry("categoriaId", "Categoria de serviço não encontrada."),
                Map.entry("valores[1].filialId", "Filial não encontrada."));

        // O mesmo nome passa no outro contratante, e lá o código começa do 1.
        JsonNode emB = criar(tokenB, servico(nome, null, null, null, List.of(valor(filialB, null))));
        assertThat(emB.path("codServico").asLong()).isEqualTo(1);

        JsonNode visto = corpo(get(ROTA + "/" + id, tokenA));
        assertThat(visto.path("nome").asString()).isEqualTo(nome);
        assertThat(visto.path("ativo").asBoolean()).isTrue();
        assertThat(visto.path("version").asLong()).isEqualTo(deA.path("version").asLong());
        assertThat(filiaisDe(visto)).containsExactly(filialA);
    }

    @Test
    void parLerEscrever() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        String f = filial(admin, unico("F")).path("id").asString();
        JsonNode s = criar(admin, servico(unico("Alvo"), null, null, null, List.of(valor(f, null))));
        String id = s.path("id").asString();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get(ROTA, comum.token()))).as("sem o grupo").isEqualTo(403);
        assertThat(status(get(ROTA + "/" + id, comum.token()))).isEqualTo(403);
        assertThat(status(get(ROTA + "/selecao", comum.token()))).as("o combo é de todos").isEqualTo(200);

        liberar(admin, u.id(), List.of(grupo("SERVICOS", "LER")), Set.of());
        assertThat(status(get(ROTA, comum.token()))).isEqualTo(200);
        assertThat(status(get(ROTA + "/" + id, comum.token()))).isEqualTo(200);
        assertThat(status(post(ROTA, comum.token(), servico(unico("Nao"), null, null, null, List.of(valor(f, null))))))
                .isEqualTo(403);
        assertThat(status(put(ROTA + "/" + id, comum.token(),
                versao(servico(unico("Nao"), null, null, null, List.of(valor(f, null))), s)))).isEqualTo(403);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", comum.token()))).isEqualTo(403);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", comum.token()))).isEqualTo(403);
        assertThat(status(get("/api/filiais", comum.token()))).as("Serviços não abre Filiais").isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("SERVICOS", "ESCREVER")), Set.of());
        assertThat(status(post(ROTA, comum.token(), servico(unico("Sim"), null, null, null, List.of(valor(f, null))))))
                .isEqualTo(201);
        assertThat(status(put(ROTA + "/" + id, comum.token(),
                versao(servico(unico("Sim"), null, null, null, List.of(valor(f, BigDecimal.TEN))), s)))).isEqualTo(200);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", comum.token()))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", comum.token()))).isEqualTo(204);
        // O cadastro rápido de categoria no Form exige o grupo dos auxiliares.
        assertThat(status(post(CATEGORIAS, comum.token(), Map.of("nome", unico("Rapida"))))).isEqualTo(403);
        assertThat(status(get(CATEGORIAS + "/selecao", comum.token()))).as("o combo de categorias é de todos")
                .isEqualTo(200);

        // Na visão de plataforma o filtro de tenant não vale: nada de ler nem gravar.
        Sessao sa = loginSuperadmin();
        assertThat(status(get(ROTA, sa.token()))).isEqualTo(422);
        assertThat(status(get(ROTA + "/selecao", sa.token()))).isEqualTo(422);
        assertThat(status(get(ROTA + "/" + id, sa.token()))).isEqualTo(422);
        assertThat(status(post(ROTA, sa.token(), servico(unico("Plat"), null, null, null, List.of(valor(f, null))))))
                .isEqualTo(422);
        assertThat(status(put(ROTA + "/" + id, sa.token(),
                versao(servico(unico("Plat"), null, null, null, List.of(valor(f, null))), s)))).isEqualTo(422);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", sa.token()))).isEqualTo(422);
    }

    // ------------------------------------------------------------ código

    @Test
    void codigo_primeiro1_segundo2_porContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        String tokenB = cb.admin().token();
        String fa = filial(tokenA, unico("FA")).path("id").asString();
        String fb = filial(tokenB, unico("FB")).path("id").asString();
        assertThat(criar(tokenA, servico(unico("Um"), null, null, null, List.of(valor(fa, null))))
                .path("codServico").asLong()).isEqualTo(1);
        assertThat(criar(tokenA, servico(unico("Dois"), null, null, null, List.of(valor(fa, null))))
                .path("codServico").asLong()).isEqualTo(2);
        assertThat(criar(tokenB, servico(unico("Outro"), null, null, null, List.of(valor(fb, null))))
                .path("codServico").asLong()).isEqualTo(1);
    }

    @Test
    void codigo_ignoradoNoCorpo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        JsonNode s = criar(token, com(servico(unico("Cod"), null, null, null, List.of(valor(f, null))),
                "codServico", 999, "id", UUID.randomUUID().toString(), "valor", 50, "ativo", false));
        assertThat(s.path("codServico").asLong()).isEqualTo(1);
        assertThat(s.path("ativo").asBoolean()).as("a situação não vem da entrada").isTrue();
        JsonNode al = corpo(put(ROTA + "/" + s.path("id").asString(), token,
                versao(com(servico(unico("Cod"), null, null, null, List.of(valor(f, null))), "codServico", 777), s)));
        assertThat(al.path("codServico").asLong()).isEqualTo(1);
    }

    /**
     * Dois cadastros ao mesmo tempo leem o mesmo maior + 1; o índice único recusa o
     * segundo e o {@code RepetirSeCodigoRepetido} tenta de novo numa transação nova.
     */
    @Test
    void codigo_doisCriarSimultaneosSem409() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        List<Long> codigos = new ArrayList<>();
        for (int rodada = 0; rodada < 8; rodada++) {
            Map<String, Object> um = servico(unico("Par"), null, null, null, List.of(valor(f, null)));
            Map<String, Object> outro = servico(unico("Par"), null, null, null, List.of(valor(f, BigDecimal.ONE)));
            CountDownLatch largada = new CountDownLatch(1);
            List<MvcTestResult> resultados = emParalelo(largada,
                    () -> {
                        largada.await();
                        return post(ROTA, token, um);
                    },
                    () -> {
                        largada.await();
                        return post(ROTA, token, outro);
                    });
            for (MvcTestResult r : resultados) {
                assertThat(status(r)).as("rodada %d: %s", rodada, texto(r)).isEqualTo(201);
                codigos.add(corpo(r).path("codServico").asLong());
            }
        }
        assertThat(codigos).as("sem buraco nem repetição")
                .containsExactlyInAnyOrderElementsOf(LongStream.rangeClosed(1, 16).boxed().toList());
    }

    @Test
    void filtroCodigoNaoAchaOutroContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String fa = filial(ca.admin().token(), unico("FA")).path("id").asString();
        String fb = filial(cb.admin().token(), unico("FB")).path("id").asString();
        criar(ca.admin().token(), servico(unico("A1"), null, null, null, List.of(valor(fa, null))));
        criar(ca.admin().token(), servico(unico("A2"), null, null, null, List.of(valor(fa, null))));
        String deB = criar(cb.admin().token(), servico(unico("B1"), null, null, null, List.of(valor(fb, null))))
                .path("id").asString();

        assertThat(ids(get(ROTA + "?codServico=2", cb.admin().token()))).isEmpty();
        assertThat(ids(get(ROTA + "?codServico=1", cb.admin().token()))).containsExactly(deB);
    }

    // ------------------------------------------------------------ regras

    @Test
    void nomeRepetidoSemAcentoNemCaixa409ComCodigo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        JsonNode s = criar(token, servico("Manutenção " + sufixo, null, null, null, List.of(valor(f, null))));

        MvcTestResult repetido = post(ROTA, token, servico("  MANUTENCAO  " + sufixo.toUpperCase() + " ", null, null,
                null, List.of(valor(f, null))));
        assertThat(status(repetido)).isEqualTo(409);
        assertThat(campos(repetido)).containsExactly("nome");
        assertThat(mensagem(repetido)).isEqualTo("Já existe o serviço código 1 com este nome.");

        JsonNode outro = criar(token, servico(unico("Outro"), null, null, null, List.of(valor(f, null))));
        MvcTestResult noPut = put(ROTA + "/" + outro.path("id").asString(), token,
                versao(servico("manutencao " + sufixo, null, null, null, List.of(valor(f, null))), outro));
        assertThat(status(noPut)).isEqualTo(409);
        assertThat(mensagem(noPut)).isEqualTo("Já existe o serviço código 1 com este nome.");

        MvcTestResult proprio = put(ROTA + "/" + s.path("id").asString(), token,
                versao(servico("MANUTENÇÃO " + sufixo, null, null, null, List.of(valor(f, null))), s));
        assertThat(status(proprio)).as("o próprio nome em outra caixa").isEqualTo(200);
    }

    /** Preço vazio é "não informado" e continua nulo no banco; 0 é gratuito. */
    @Test
    void precoVazioNaoViraZero() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String vazio = filial(token, unico("Vazio")).path("id").asString();
        String gratis = filial(token, unico("Gratis")).path("id").asString();
        JsonNode s = criar(token, servico(unico("Preco"), null, null, null,
                List.of(valor(vazio, null), valor(gratis, BigDecimal.ZERO))));

        JsonNode lido = corpo(get(ROTA + "/" + s.path("id").asString(), token));
        Map<String, JsonNode> porFilial = new HashMap<>();
        lido.path("valores").valueStream().forEach(v -> porFilial.put(v.path("filial").path("id").asString(), v));
        assertThat(porFilial.get(vazio).path("valor").isNull()).isTrue();
        assertThat(porFilial.get(gratis).path("valor").isNull()).isFalse();
        assertThat(porFilial.get(gratis).path("valor").decimalValue()).isEqualByComparingTo("0");

        assertThat(jdbc.queryForObject("SELECT valor FROM servico_filial WHERE filial_id = ?", BigDecimal.class,
                UUID.fromString(vazio))).isNull();
        assertThat(jdbc.queryForObject("SELECT valor FROM servico_filial WHERE filial_id = ?", BigDecimal.class,
                UUID.fromString(gratis))).isEqualByComparingTo("0.00");
    }

    @Test
    void filialRepetidaInexistenteEInativa400TodasDeUmaVez() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String inativa = filial(token, unico("Inativa")).path("id").asString();
        assertThat(status(patch("/api/filiais/" + inativa + "/inativar", token))).isEqualTo(204);
        String categoria = categoria(token, unico("Cat")).path("id").asString();
        assertThat(status(patch(CATEGORIAS + "/" + categoria + "/inativar", token))).isEqualTo(204);

        MvcTestResult r = post(ROTA, token, servico(unico("Erros"), categoria, null, null, List.of(
                valor(f, null), valor(f, BigDecimal.ONE), valor(UUID.randomUUID().toString(), null),
                valor(inativa, null))));
        assertThat(status(r)).isEqualTo(400);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo("VALIDACAO");
        assertThat(erros(r)).containsExactly(
                Map.entry("categoriaId", "Categoria de serviço inativa."),
                Map.entry("valores[1].filialId", "Esta filial já está na lista."),
                Map.entry("valores[2].filialId", "Filial não encontrada."),
                Map.entry("valores[3].filialId", "Esta filial está inativa."));
        assertThat(ids(get(ROTA, token))).as("nada gravado").isEmpty();

        MvcTestResult um = post(ROTA, token, servico(unico("Um"), null, null, null,
                List.of(valor(f, null), valor(inativa, null))));
        assertThat(erros(um)).containsExactly(Map.entry("valores[1].filialId", "Esta filial está inativa."));
        assertThat(corpo(um).path("detail").asString()).as("um erro só: o detail é a mensagem dele")
                .isEqualTo("Esta filial está inativa.");
    }

    /** A filial já gravada e inativada depois continua, sinalizada, e o preço dela ainda se corrige. */
    @Test
    void filialInativadaDepoisContinua() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f1 = filial(token, unico("F1")).path("id").asString();
        String f2 = filial(token, unico("F2")).path("id").asString();
        JsonNode s = criar(token, servico(unico("Fica"), null, null, null,
                List.of(valor(f1, BigDecimal.TEN), valor(f2, BigDecimal.ONE))));
        String id = s.path("id").asString();

        assertThat(status(patch("/api/filiais/" + f2 + "/inativar", token))).as("inativar a filial não olha os serviços")
                .isEqualTo(204);
        JsonNode lido = corpo(get(ROTA + "/" + id, token));
        assertThat(lido.path("valores").get(1).path("filial").path("id").asString()).isEqualTo(f2);
        assertThat(lido.path("valores").get(1).path("filialAtiva").asBoolean()).isFalse();
        assertThat(ids(get(ROTA + "?filialId=" + f2, token))).containsExactly(id);

        MvcTestResult corrigido = put(ROTA + "/" + id, token, versao(servico(s.path("nome").asString(), null, null, null,
                List.of(valor(f1, BigDecimal.TEN), valor(f2, new BigDecimal("99.90")))), lido));
        assertThat(status(corrigido)).as(texto(corrigido)).isEqualTo(200);
        JsonNode linha = corpo(corrigido).path("valores").get(1);
        assertThat(linha.path("valor").decimalValue()).isEqualByComparingTo("99.90");
        assertThat(linha.path("filialAtiva").asBoolean()).isFalse();

        // Tirada da lista, ela não volta inativa.
        JsonNode semF2 = corpo(put(ROTA + "/" + id, token, versao(servico(s.path("nome").asString(), null, null, null,
                List.of(valor(f1, BigDecimal.TEN))), corpo(corrigido))));
        MvcTestResult volta = put(ROTA + "/" + id, token, versao(servico(s.path("nome").asString(), null, null, null,
                List.of(valor(f1, BigDecimal.TEN), valor(f2, null))), semF2));
        assertThat(erros(volta)).containsExactly(Map.entry("valores[1].filialId", "Esta filial está inativa."));
    }

    @Test
    void categoriaInativaSoSeJaEraDoServico() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String categoria = categoria(token, unico("Cat")).path("id").asString();
        JsonNode s = criar(token, servico(unico("ComCat"), categoria, null, null, List.of(valor(f, null))));
        assertThat(status(patch(CATEGORIAS + "/" + categoria + "/inativar", token))).isEqualTo(204);

        JsonNode lido = corpo(get(ROTA + "/" + s.path("id").asString(), token));
        assertThat(lido.path("categoria").path("ativo").asBoolean()).as("\"Nome (inativo)\" na tela").isFalse();
        MvcTestResult mesma = put(ROTA + "/" + s.path("id").asString(), token,
                versao(servico(s.path("nome").asString(), categoria, 45, null, List.of(valor(f, null))), lido));
        assertThat(status(mesma)).as("a já gravada continua: %s", texto(mesma)).isEqualTo(200);
        assertThat(corpo(mesma).path("duracaoMinutos").asInt()).isEqualTo(45);

        MvcTestResult nova = post(ROTA, token, servico(unico("Nova"), categoria, null, null, List.of(valor(f, null))));
        assertThat(erros(nova)).containsExactly(Map.entry("categoriaId", "Categoria de serviço inativa."));
        MvcTestResult inexistente = post(ROTA, token, servico(unico("Nova"), UUID.randomUUID().toString(), null, null,
                List.of(valor(f, null))));
        assertThat(erros(inexistente)).containsExactly(Map.entry("categoriaId", "Categoria de serviço não encontrada."));
    }

    @Test
    void versaoAntiga409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String nome = unico("Versao");
        JsonNode s = criar(token, servico(nome, null, null, null, List.of(valor(f, null))));
        String id = s.path("id").asString();
        assertThat(status(put(ROTA + "/" + id, token, versao(servico(nome + " 1", null, null, null,
                List.of(valor(f, null))), s)))).isEqualTo(200);

        MvcTestResult velha = put(ROTA + "/" + id, token, versao(servico(nome + " 2", null, null, null,
                List.of(valor(f, null))), s));
        assertThat(status(velha)).isEqualTo(409);
        assertThat(corpo(velha).path("detail").asString())
                .isEqualTo("Este serviço foi alterado por outro usuário. Recarregue e tente de novo.");
        assertThat(corpo(velha).has("erros")).as("versão sai sem campo").isFalse();
        assertThat(corpo(get(ROTA + "/" + id, token)).path("nome").asString()).isEqualTo(nome + " 1");
    }

    /** Mudar só o preço de uma filial também sobe a versão: a ficha aberta em outra tela recebe 409. */
    @Test
    void putSoComFiliaisSobeVersao() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String nome = unico("SoFiliais");
        JsonNode s = criar(token, servico(nome, null, 60, null, List.of(valor(f, BigDecimal.ONE))));
        String id = s.path("id").asString();

        MvcTestResult soPreco = put(ROTA + "/" + id, token, versao(servico(nome, null, 60, null,
                List.of(valor(f, BigDecimal.TEN))), s));
        assertThat(status(soPreco)).isEqualTo(200);
        assertThat(corpo(soPreco).path("version").asLong()).isEqualTo(s.path("version").asLong() + 1);
        assertThat(corpo(get(ROTA + "/" + id, token)).path("version").asLong())
                .as("a resposta já traz a versão gravada").isEqualTo(corpo(soPreco).path("version").asLong());

        MvcTestResult outraTela = put(ROTA + "/" + id, token, versao(servico(nome, null, 60, null,
                List.of(valor(f, BigDecimal.ONE))), s));
        assertThat(status(outraTela)).isEqualTo(409);
        assertThat(corpo(get(ROTA + "/" + id, token)).path("valores").get(0).path("valor").decimalValue())
                .isEqualByComparingTo("10");
    }

    @Test
    void sortSoPorCodigoENome() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String p = unico("Ordem");
        String b = criar(token, servico(p + " B", null, null, null, List.of(valor(f, null)))).path("id").asString();
        String a = criar(token, servico(p + " A", null, null, null, List.of(valor(f, null)))).path("id").asString();

        assertThat(ids(get(ROTA, token))).as("por nome").containsExactly(a, b);
        assertThat(ids(get(ROTA + "?sort=codServico", token))).containsExactly(b, a);
        assertThat(ids(get(ROTA + "?sort=nome,desc", token))).containsExactly(b, a);
        assertThat(status(get(ROTA + "?sort=valor", token))).isEqualTo(422);
        assertThat(status(get(ROTA + "?sort=duracaoMinutos", token))).isEqualTo(422);
    }

    // ------------------------------------------------------------ lista e seleção

    @Test
    void filtros() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String centro = filial(token, unico("Centro")).path("id").asString();
        String norte = filial(token, unico("Norte")).path("id").asString();
        String semServico = filial(token, unico("Vazia")).path("id").asString();
        String categoria = categoria(token, unico("Cat")).path("id").asString();
        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        String instalacao = criar(token, servico("Instalação " + sufixo, categoria, null, null,
                List.of(valor(centro, BigDecimal.TEN), valor(norte, null)))).path("id").asString();
        String manutencao = criar(token, servico("Manutenção " + sufixo, null, null, null,
                List.of(valor(norte, BigDecimal.ONE)))).path("id").asString();
        String consultoria = criar(token, servico("Consultoria " + sufixo, categoria, null, null,
                List.of(valor(centro, null)))).path("id").asString();
        assertThat(status(patch(ROTA + "/" + consultoria + "/inativar", token))).isEqualTo(204);

        assertThat(ids(get(ROTA + "?busca=INSTALACAO", token))).as("sem acento nem caixa").containsExactly(instalacao);
        assertThat(ids(get(ROTA + "?codServico=2", token))).containsExactly(manutencao);
        assertThat(ids(get(ROTA + "?categoriaId=" + categoria, token))).containsExactly(consultoria, instalacao);
        assertThat(ids(get(ROTA + "?filialId=" + centro, token))).as("só os prestados nela")
                .containsExactly(consultoria, instalacao);
        assertThat(ids(get(ROTA + "?filialId=" + norte, token))).containsExactly(instalacao, manutencao);
        assertThat(ids(get(ROTA + "?filialId=" + semServico, token))).isEmpty();
        assertThat(ids(get(ROTA + "?filialId=" + norte + "&categoriaId=" + categoria + "&ativo=true", token)))
                .containsExactly(instalacao);
        assertThat(ids(get(ROTA + "?ativo=true", token))).containsExactly(instalacao, manutencao);
        assertThat(ids(get(ROTA + "?ativo=false", token))).containsExactly(consultoria);
        assertThat(ids(get(ROTA + "?codServico=&busca=&categoriaId=&filialId=&ativo=", token))).as("todos vazios")
                .containsExactly(consultoria, instalacao, manutencao);

        // Com o filtro de filial, cada serviço continua com todas as suas filiais (a tela escolhe o preço).
        JsonNode linha = corpo(get(ROTA + "?filialId=" + centro + "&busca=instalacao", token)).path("conteudo").get(0);
        assertThat(filiaisDe(linha)).hasSize(2);
    }

    @Test
    void selecaoSoAtivosPorNomeSemPreco() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f = filial(token, unico("F")).path("id").asString();
        String p = unico("Combo");
        String b = criar(token, servico(p + " B", null, 30, null, List.of(valor(f, BigDecimal.TEN)))).path("id").asString();
        String a = criar(token, servico(p + " A", null, null, null, List.of(valor(f, null)))).path("id").asString();
        String inativo = criar(token, servico(p + " C", null, null, null, List.of(valor(f, null)))).path("id").asString();
        assertThat(status(patch(ROTA + "/" + inativo + "/inativar", token))).isEqualTo(204);

        assertThat(ids(get(ROTA + "/selecao", token))).as("só os ativos, por nome").containsExactly(a, b);
        assertThat(ids(get(ROTA + "/selecao?busca=" + p.toUpperCase() + " b", token))).containsExactly(b);

        JsonNode item = corpo(get(ROTA + "/selecao?busca=" + p + " b", token)).get(0);
        assertThat(item.path("id").asString()).isEqualTo(b);
        assertThat(item.path("codServico").asLong()).isEqualTo(1);
        assertThat(item.path("nome").asString()).isEqualTo(p + " B");
        assertThat(item.size()).as("id, código e nome; nunca preço").isEqualTo(3);
    }

    /** A lista não cai em N+1: página (com categoria), contagem, filiais em lote e nomes = no máximo 4 comandos. */
    @Test
    void listaSemNMais1() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String f1 = filial(token, unico("F1")).path("id").asString();
        String f2 = filial(token, unico("F2")).path("id").asString();
        String categoria = categoria(token, unico("Cat")).path("id").asString();
        for (int i = 0; i < 5; i++) {
            criar(token, servico(unico("Lote" + i), categoria, 30, null,
                    List.of(valor(f1, BigDecimal.TEN), valor(f2, null))));
        }
        Statistics estatisticas = emf.unwrap(SessionFactory.class).getStatistics();
        boolean ligadas = estatisticas.isStatisticsEnabled();
        estatisticas.setStatisticsEnabled(true);
        try {
            assertThat(status(get(ROTA + "?size=2", token))).isEqualTo(200);
            long comDuas = comandos(estatisticas, ROTA + "?size=2", token, 2);
            long comQuatro = comandos(estatisticas, ROTA + "?size=4", token, 4);
            assertThat(comQuatro).as("mesmo número de comandos com mais linhas").isEqualTo(comDuas);
            assertThat(comQuatro).as("página, contagem, filiais e nomes da auditoria").isLessThanOrEqualTo(4);
        } finally {
            estatisticas.setStatisticsEnabled(ligadas);
        }
    }

    // ------------------------------------------------------------ banco

    /** As restrições do banco seguram mesmo sem passar pelo Java. */
    @Test
    void checksEFksDoBanco() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String token = ca.admin().token();
        UUID f = UUID.fromString(filial(token, unico("F")).path("id").asString());
        UUID s = UUID.fromString(criar(token, servico(unico("Banco"), null, null, null,
                List.of(valor(f.toString(), BigDecimal.ONE)))).path("id").asString());
        UUID filialDeB = UUID.fromString(filial(cb.admin().token(), unico("FB")).path("id").asString());
        UUID categoriaDeB = UUID.fromString(categoria(cb.admin().token(), unico("CB")).path("id").asString());

        assertThatThrownBy(() -> jdbc.update("UPDATE servico SET duracao_minutos = 0 WHERE id = ?", s))
                .hasMessageContaining("ck_servico_duracao_minutos");
        assertThatThrownBy(() -> jdbc.update("UPDATE servico SET duracao_minutos = 1441 WHERE id = ?", s))
                .hasMessageContaining("ck_servico_duracao_minutos");
        assertThatThrownBy(() -> jdbc.update("UPDATE servico SET cod_servico = 0 WHERE id = ?", s))
                .hasMessageContaining("ck_servico_cod_servico");
        assertThatThrownBy(() -> jdbc.update("UPDATE servico_filial SET valor = -0.01 WHERE servico_id = ?", s))
                .hasMessageContaining("ck_servico_filial_valor");
        assertThatThrownBy(() -> jdbc.update("UPDATE servico_filial SET filial_id = ? WHERE servico_id = ?", filialDeB, s))
                .as("filial de outro contratante").hasMessageContaining("fk_servico_filial_filial");
        assertThatThrownBy(() -> jdbc.update("UPDATE servico SET categoria_servico_id = ? WHERE id = ?", categoriaDeB, s))
                .as("categoria de outro contratante").hasMessageContaining("fk_servico_categoria");
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO servico_filial (id, tenant_id, servico_id, filial_id, created_at, version)
                SELECT gen_random_uuid(), tenant_id, servico_id, filial_id, now(), 0 FROM servico_filial
                WHERE servico_id = ?""", s))
                .as("a mesma filial duas vezes").hasMessageContaining("uk_servico_filial_servico_filial");
    }

    // ------------------------------------------------------------ apoio

    private static Map<String, Object> servico(String nome, String categoriaId, Integer duracao, String descricao,
                                               List<Map<String, Object>> valores) {
        Map<String, Object> m = new HashMap<>();
        m.put("nome", nome);
        m.put("categoriaId", categoriaId);
        m.put("duracaoMinutos", duracao);
        m.put("descricao", descricao);
        m.put("valores", valores);
        return m;
    }

    private static Map<String, Object> valor(String filialId, BigDecimal valor) {
        Map<String, Object> m = new HashMap<>();
        m.put("filialId", filialId);
        m.put("valor", valor);
        return m;
    }

    private JsonNode criar(String token, Map<String, Object> corpo) {
        MvcTestResult r = post(ROTA, token, corpo);
        assertThat(status(r)).as("criar serviço: %s", texto(r)).isEqualTo(201);
        return corpo(r);
    }

    private JsonNode categoria(String token, String nome) {
        MvcTestResult r = post(CATEGORIAS, token, Map.of("nome", nome));
        assertThat(status(r)).as("criar categoria: %s", texto(r)).isEqualTo(201);
        return corpo(r);
    }

    /** Uma pessoa jurídica nova e a matriz dela (várias matrizes por contratante). */
    private JsonNode filial(String token, String nome) {
        Map<String, Object> f = new HashMap<>();
        f.put("pessoaId", pessoaPJ(token, nome));
        f.put("tipo", "MATRIZ");
        f.put("cor", "#3B82F6");
        MvcTestResult r = post("/api/filiais", token, f);
        assertThat(status(r)).as("criar filial: %s", texto(r)).isEqualTo(201);
        return corpo(r);
    }

    private String pessoaPJ(String token, String nome) {
        Map<String, Object> m = new HashMap<>();
        m.put("tipoPessoa", "JURIDICA");
        m.put("nome", nome);
        m.put("cnpj", cnpj());
        m.put("tiposCadastroIds", List.of(cliente(token)));
        m.put("telefones", List.of());
        m.put("emails", List.of());
        m.put("redesSociais", List.of());
        m.put("enderecos", List.of());
        m.put("vinculos", List.of());
        MvcTestResult r = post("/api/pessoas", token, m);
        assertThat(status(r)).as("criar pessoa: %s", texto(r)).isEqualTo(201);
        return corpo(r).path("id").asString();
    }

    private String cliente(String token) {
        return clientePorToken.computeIfAbsent(token, t -> corpo(get("/api/tipos-cadastro/selecao", t)).valueStream()
                .filter(n -> "CLIENTE".equals(n.path("chave").asString()))
                .findFirst().orElseThrow().path("id").asString());
    }

    /** Cópia de {@code corpo} com os pares chave, valor trocados (valor pode ser nulo). */
    private static Map<String, Object> com(Map<String, Object> corpo, Object... pares) {
        Map<String, Object> m = new HashMap<>(corpo);
        for (int i = 0; i < pares.length; i += 2) {
            m.put((String) pares[i], pares[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> versao(Map<String, Object> corpo, JsonNode ficha) {
        return com(corpo, "version", ficha.path("version").asLong());
    }

    private static List<String> filiaisDe(JsonNode servico) {
        return servico.path("valores").valueStream().map(v -> v.path("filial").path("id").asString()).toList();
    }

    private long comandos(Statistics estatisticas, String uri, String token, int linhas) {
        estatisticas.clear();
        MvcTestResult r = get(uri, token);
        assertThat(corpo(r).path("conteudo").size()).isEqualTo(linhas);
        return estatisticas.getPrepareStatementCount();
    }

    private List<MvcTestResult> emParalelo(CountDownLatch largada, Callable<MvcTestResult> um,
                                           Callable<MvcTestResult> outro) throws Exception {
        try (var pool = Executors.newFixedThreadPool(2)) {
            var primeiro = pool.submit(um);
            var segundo = pool.submit(outro);
            largada.countDown();
            return List.of(primeiro.get(30, TimeUnit.SECONDS), segundo.get(30, TimeUnit.SECONDS));
        }
    }

    private List<String> campos(MvcTestResult r) {
        assertThat(status(r)).as("status com erros de campo: %s", texto(r)).isIn(400, 409);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }

    private List<Map.Entry<String, String>> erros(MvcTestResult r) {
        assertThat(status(r)).as("status com erros de campo: %s", texto(r)).isEqualTo(400);
        return corpo(r).path("erros").valueStream()
                .map(e -> Map.entry(e.path("campo").asString(), e.path("mensagem").asString())).toList();
    }

    private String mensagem(MvcTestResult r) {
        return corpo(r).path("erros").get(0).path("mensagem").asString();
    }

    private List<String> ids(MvcTestResult r) {
        assertThat(status(r)).as(texto(r)).isEqualTo(200);
        JsonNode n = corpo(r);
        JsonNode lista = n.has("conteudo") ? n.path("conteudo") : n;
        return lista.valueStream().map(i -> i.path("id").asString()).toList();
    }

    private static String texto(MvcTestResult r) {
        try {
            return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        } catch (java.io.UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    /** CNPJ numérico válido sorteado (14 dígitos, sem máscara). */
    private static String cnpj() {
        int[] d = new int[14];
        for (int i = 0; i < 12; i++) {
            d[i] = ThreadLocalRandom.current().nextInt(10);
        }
        d[12] = digitoCnpj(d, new int[] {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        d[13] = digitoCnpj(d, new int[] {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        StringBuilder s = new StringBuilder();
        for (int x : d) {
            s.append(x);
        }
        return s.toString();
    }

    private static int digitoCnpj(int[] d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += d[i] * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
