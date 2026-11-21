package com.api.ero_api.auxiliar;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.stream.LongStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Os 7 cadastros auxiliares. Cada teste roda nas 7 rotas: as 6 cópias do TipoCadastro
 * não escapam sem teste. Além dos 4 obrigatórios, o código ({@code cod_<tabela>}) e as
 * regras dos itens do sistema.
 */
class AuxiliarIntegracaoTest extends IntegracaoTest {

    /** Uma rota de auxiliar: o campo do código, o tamanho máximo do nome e os itens do sistema na ordem do código. */
    record Auxiliar(String rota, String campoCodigo, int maximoNome, List<String> chaves, List<String> nomes) {

        int quantosDoSistema() {
            return chaves.size();
        }

        @Override
        public String toString() {
            return rota;
        }
    }

    static Stream<Auxiliar> auxiliares() {
        return Stream.of(
                new Auxiliar("/api/tipos-cadastro", "codTipoCadastro", 25,
                        List.of("CLIENTE", "FORNECEDOR", "FUNCIONARIO", "LEAD", "OUTROS"),
                        List.of("Cliente", "Fornecedor", "Funcionário", "Lead", "Outros")),
                new Auxiliar("/api/tipos-telefone", "codTipoTelefone", 25,
                        List.of("CELULAR", "WHATSAPP", "RESIDENCIAL", "COMERCIAL"),
                        List.of("Celular", "WhatsApp", "Residencial", "Comercial")),
                new Auxiliar("/api/tipos-email", "codTipoEmail", 25,
                        List.of("PARTICULAR", "COMERCIAL"),
                        List.of("Particular", "Comercial")),
                new Auxiliar("/api/tipos-endereco", "codTipoEndereco", 25,
                        List.of("RESIDENCIAL", "COMERCIAL", "COBRANCA"),
                        List.of("Residencial", "Comercial", "Cobrança")),
                new Auxiliar("/api/tipos-rede-social", "codTipoRedeSocial", 25,
                        List.of("INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK", "X"),
                        List.of("Instagram", "Facebook", "LinkedIn", "TikTok", "X")),
                new Auxiliar("/api/estados-civis", "codEstadoCivil", 25,
                        List.of("SOLTEIRO", "CASADO", "UNIAO_ESTAVEL", "SEPARADO", "DIVORCIADO", "VIUVO"),
                        List.of("Solteiro(a)", "Casado(a)", "União estável", "Separado(a)", "Divorciado(a)", "Viúvo(a)")),
                new Auxiliar("/api/profissoes", "codProfissao", 40,
                        List.of("AUTONOMO", "EMPRESARIO", "SERVIDOR_PUBLICO", "PROFISSIONAL_LIBERAL", "APOSENTADO",
                                "ESTUDANTE", "DO_LAR"),
                        List.of("Autônomo(a)", "Empresário(a)", "Servidor(a) público(a)", "Profissional liberal",
                                "Aposentado(a)", "Estudante", "Do lar")));
    }

    // ------------------------------------------------------------ obrigatórios

    @ParameterizedTest
    @MethodSource("auxiliares")
    void caminhoFeliz_listaOsDoSistemaECriaAlteraInativaAtiva(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String adminId = c.admin().corpo().path("usuario").path("id").asString();

        JsonNode lista = corpo(get(a.rota() + "?size=100&sort=" + a.campoCodigo(), token));
        assertThat(lista.path("totalElementos").asLong()).isEqualTo(a.quantosDoSistema());
        lista.path("conteudo").valueStream().forEach(item -> {
            assertThat(item.path("sistema").asBoolean()).isTrue();
            assertThat(item.path("ativo").asBoolean()).isTrue();
            assertThat(item.path("createdBy").isNull()).as("semeado pelo suporte: o id dele não sai").isTrue();
        });

        String nome = unico("Proprio");
        MvcTestResult criado = post(a.rota(), token, Map.of("nome", "  " + nome + "  "));
        assertThat(status(criado)).isEqualTo(201);
        JsonNode t = corpo(criado);
        String id = t.path("id").asString();
        assertThat(t.path("nome").asString()).as("sem espaço nas pontas").isEqualTo(nome);
        assertThat(t.path("sistema").asBoolean()).isFalse();
        assertThat(t.path("ativo").asBoolean()).isTrue();
        assertThat(t.path("createdBy").asString()).isEqualTo(adminId);
        assertThat(t.path("criadoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(t.has("chave")).as("a chave só vai no /selecao").isFalse();

        MvcTestResult alterado = put(a.rota() + "/" + id, token,
                Map.of("nome", nome + "X", "version", t.path("version").asLong()));
        assertThat(status(alterado)).isEqualTo(200);
        JsonNode al = corpo(alterado);
        assertThat(al.path("nome").asString()).isEqualTo(nome + "X");
        assertThat(al.path("version").asLong()).as("resposta já traz a versão nova").isEqualTo(t.path("version").asLong() + 1);
        assertThat(al.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(status(put(a.rota() + "/" + id, token, Map.of("nome", nome, "version", t.path("version").asLong()))))
                .as("versão antiga").isEqualTo(409);

        assertThat(status(patch(a.rota() + "/" + id + "/inativar", token))).isEqualTo(204);
        assertThat(item(get(a.rota() + "?size=100", token), id).path("ativo").asBoolean()).isFalse();
        assertThat(status(patch(a.rota() + "/" + id + "/inativar", token))).as("já inativo").isEqualTo(204);
        assertThat(status(patch(a.rota() + "/" + id + "/ativar", token))).isEqualTo(204);
        assertThat(item(get(a.rota() + "?size=100", token), id).path("ativo").asBoolean()).isTrue();
    }

    @ParameterizedTest
    @MethodSource("auxiliares")
    void validacaoRecusada(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();

        assertThat(campos(post(a.rota(), token, Map.of("nome", "")))).containsExactly("nome");
        assertThat(campos(post(a.rota(), token, Map.of("nome", "   ")))).containsExactly("nome");
        assertThat(campos(post(a.rota(), token, Map.of("nome", "A".repeat(a.maximoNome() + 1))))).containsExactly("nome");
        assertThat(status(post(a.rota(), token,
                Map.of("nome", unico("Teto").substring(0, 13) + "B".repeat(a.maximoNome() - 13)))))
                .as("%d caracteres cabem", a.maximoNome()).isEqualTo(201);

        String id = corpo(post(a.rota(), token, Map.of("nome", unico("Valido")))).path("id").asString();
        assertThat(campos(put(a.rota() + "/" + id, token, Map.of("nome", "Sem versao")))).containsExactly("version");
        assertThat(campos(put(a.rota() + "/" + id, token, Map.of("nome", "B".repeat(a.maximoNome() + 1), "version", 0))))
                .containsExactly("nome");
        assertThat(status(get(a.rota() + "?sort=chave", token))).as("ordenação fora da lista branca").isEqualTo(422);
    }

    @ParameterizedTest
    @MethodSource("auxiliares")
    void isolamentoEntreTenants(Auxiliar a) {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String nome = unico("DeA");
        JsonNode deA = corpo(post(a.rota(), ca.admin().token(), Map.of("nome", nome)));
        String id = deA.path("id").asString();
        String tokenB = cb.admin().token();

        assertThat(ids(get(a.rota() + "?size=100", tokenB))).doesNotContain(id);
        assertThat(ids(get(a.rota() + "/selecao?inativos=true", tokenB))).doesNotContain(id);
        assertThat(status(put(a.rota() + "/" + id, tokenB, Map.of("nome", "Invasor", "version", 0)))).isEqualTo(404);
        assertThat(status(patch(a.rota() + "/" + id + "/inativar", tokenB))).isEqualTo(404);
        assertThat(status(patch(a.rota() + "/" + id + "/ativar", tokenB))).isEqualTo(404);

        // O mesmo nome passa no outro contratante, e lá o código também segue do N+1.
        MvcTestResult emB = post(a.rota(), tokenB, Map.of("nome", nome));
        assertThat(status(emB)).isEqualTo(201);
        assertThat(corpo(emB).path(a.campoCodigo()).asLong()).isEqualTo(a.quantosDoSistema() + 1L);

        JsonNode visto = item(get(a.rota() + "?size=100", ca.admin().token()), id);
        assertThat(visto.path("nome").asString()).isEqualTo(nome);
        assertThat(visto.path("ativo").asBoolean()).isTrue();
        assertThat(visto.path("version").asLong()).isEqualTo(deA.path("version").asLong());
    }

    @ParameterizedTest
    @MethodSource("auxiliares")
    void parLerEscrever(Auxiliar a) {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        String id = corpo(post(a.rota(), admin, Map.of("nome", unico("Alvo")))).path("id").asString();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get(a.rota(), comum.token()))).as("sem o grupo").isEqualTo(403);
        assertThat(status(get(a.rota() + "/selecao", comum.token()))).as("combo é de todos").isEqualTo(200);

        liberar(admin, u.id(), List.of(grupo("CADASTROS_AUXILIARES", "LER")), Set.of());
        assertThat(status(get(a.rota(), comum.token()))).isEqualTo(200);
        assertThat(status(post(a.rota(), comum.token(), Map.of("nome", unico("Nao"))))).isEqualTo(403);
        assertThat(status(put(a.rota() + "/" + id, comum.token(), Map.of("nome", unico("Nao"), "version", 0))))
                .isEqualTo(403);
        assertThat(status(patch(a.rota() + "/" + id + "/inativar", comum.token()))).isEqualTo(403);
        assertThat(status(patch(a.rota() + "/" + id + "/ativar", comum.token()))).isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("CADASTROS_AUXILIARES", "ESCREVER")), Set.of());
        assertThat(status(post(a.rota(), comum.token(), Map.of("nome", unico("Sim"))))).isEqualTo(201);

        // Na visão de plataforma o filtro de tenant não vale: nada de ler nem gravar.
        Sessao s = loginSuperadmin();
        assertThat(status(get(a.rota(), s.token()))).isEqualTo(422);
        assertThat(status(get(a.rota() + "/selecao", s.token()))).isEqualTo(422);
        assertThat(status(post(a.rota(), s.token(), Map.of("nome", unico("Plat"))))).isEqualTo(422);
        assertThat(status(patch(a.rota() + "/" + id + "/inativar", s.token()))).isEqualTo(422);
    }

    // ------------------------------------------------------------ código

    @ParameterizedTest
    @MethodSource("auxiliares")
    void codigo_itensDoSistemaSao1aN_oPrimeiroProprioEhNmais1(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();

        JsonNode lista = corpo(get(a.rota() + "?size=100&sort=" + a.campoCodigo(), token));
        List<Long> codigos = lista.path("conteudo").valueStream().map(n -> n.path(a.campoCodigo()).asLong()).toList();
        List<String> nomes = lista.path("conteudo").valueStream().map(n -> n.path("nome").asString()).toList();
        assertThat(codigos).containsExactlyElementsOf(LongStream.rangeClosed(1, a.quantosDoSistema()).boxed().toList());
        assertThat(nomes).containsExactlyElementsOf(a.nomes());

        long n = a.quantosDoSistema();
        assertThat(corpo(post(a.rota(), token, Map.of("nome", unico("Um")))).path(a.campoCodigo()).asLong()).isEqualTo(n + 1);
        assertThat(corpo(post(a.rota(), token, Map.of("nome", unico("Dois")))).path(a.campoCodigo()).asLong()).isEqualTo(n + 2);
    }

    @ParameterizedTest
    @MethodSource("auxiliares")
    void codigo_ignoradoNoCorpo(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Map<String, Object> corpoCriar = new HashMap<>();
        corpoCriar.put("nome", unico("Cod"));
        corpoCriar.put(a.campoCodigo(), 999);
        corpoCriar.put("chave", "CLIENTE");
        JsonNode t = corpo(post(a.rota(), token, corpoCriar));
        assertThat(t.path(a.campoCodigo()).asLong()).isEqualTo(a.quantosDoSistema() + 1L);
        assertThat(t.path("sistema").asBoolean()).as("a chave não vem da entrada").isFalse();

        Map<String, Object> corpoAlterar = new HashMap<>();
        corpoAlterar.put("nome", unico("Cod"));
        corpoAlterar.put(a.campoCodigo(), 777);
        corpoAlterar.put("version", t.path("version").asLong());
        JsonNode al = corpo(put(a.rota() + "/" + t.path("id").asString(), token, corpoAlterar));
        assertThat(al.path(a.campoCodigo()).asLong()).isEqualTo(a.quantosDoSistema() + 1L);
    }

    /**
     * Dois cadastros ao mesmo tempo leem o mesmo maior + 1; o índice único recusa o
     * segundo e o {@code RepetirSeCodigoRepetido} tenta de novo numa transação nova.
     * Sem a retentativa um dos dois termina em 409 (este teste fica vermelho).
     */
    @Test
    void codigo_doisCriarSimultaneosSem409() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        List<Long> codigos = new ArrayList<>();
        for (int rodada = 0; rodada < 8; rodada++) {
            CountDownLatch largada = new CountDownLatch(1);
            java.util.concurrent.Callable<MvcTestResult> cadastro = () -> {
                largada.await();
                return post("/api/tipos-cadastro", token, Map.of("nome", unico("Par")));
            };
            List<MvcTestResult> resultados;
            try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
                var primeiro = pool.submit(cadastro);
                var segundo = pool.submit(cadastro);
                largada.countDown();
                resultados = List.of(primeiro.get(30, TimeUnit.SECONDS), segundo.get(30, TimeUnit.SECONDS));
            }
            for (MvcTestResult r : resultados) {
                assertThat(status(r)).as("rodada %d: %s", rodada, r.getResponse().getContentAsString()).isEqualTo(201);
                codigos.add(corpo(r).path("codTipoCadastro").asLong());
            }
        }
        assertThat(codigos).as("1..5 são do sistema; os 16 seguem sem buraco nem repetição")
                .containsExactlyInAnyOrderElementsOf(LongStream.rangeClosed(6, 21).boxed().toList());
    }

    // ------------------------------------------------------------ regras

    @ParameterizedTest
    @MethodSource("auxiliares")
    void itemDoSistemaNaoAltera422(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();
        JsonNode sistema = corpo(get(a.rota() + "?size=100", token)).path("conteudo").get(0);
        String id = sistema.path("id").asString();

        MvcTestResult alterar = put(a.rota() + "/" + id, token,
                Map.of("nome", unico("Outro"), "version", sistema.path("version").asLong()));
        assertThat(status(alterar)).isEqualTo(422);
        assertThat(corpo(alterar).path("detail").asString()).isEqualTo("Itens do sistema não podem ser alterados.");
        assertThat(status(patch(a.rota() + "/" + id + "/inativar", token))).isEqualTo(422);
        assertThat(status(patch(a.rota() + "/" + id + "/ativar", token))).isEqualTo(422);

        JsonNode depois = item(get(a.rota() + "?size=100", token), id);
        assertThat(depois.path("nome").asString()).isEqualTo(sistema.path("nome").asString());
        assertThat(depois.path("ativo").asBoolean()).isTrue();
        assertThat(depois.path("version").asLong()).isEqualTo(sistema.path("version").asLong());
    }

    /** Nome único no contratante sem caixa nem acento, contando os do sistema. */
    @ParameterizedTest
    @MethodSource("auxiliares")
    void nomeRepetidoComOSistema409(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String doSistema = a.nomes().getFirst();

        for (String repetido : List.of(doSistema.toLowerCase(), doSistema.toUpperCase(), " " + doSistema + " ")) {
            MvcTestResult r = post(a.rota(), token, Map.of("nome", repetido));
            assertThat(status(r)).as(repetido).isEqualTo(409);
            assertThat(campos(r)).containsExactly("nome");
        }

        String nome = unico("Própria");
        JsonNode proprio = corpo(post(a.rota(), token, Map.of("nome", nome)));
        assertThat(campos(post(a.rota(), token, Map.of("nome", nome.toUpperCase().replace("Ó", "O")))))
                .as("sem acento e em maiúsculas").containsExactly("nome");
        JsonNode outro = corpo(post(a.rota(), token, Map.of("nome", unico("Outra"))));
        assertThat(campos(put(a.rota() + "/" + outro.path("id").asString(), token,
                Map.of("nome", nome, "version", outro.path("version").asLong())))).as("PUT para nome já usado")
                .containsExactly("nome");
        assertThat(status(put(a.rota() + "/" + proprio.path("id").asString(), token,
                Map.of("nome", nome.toUpperCase(), "version", proprio.path("version").asLong()))))
                .as("o próprio nome em outra caixa").isEqualTo(200);
    }

    @Test
    void nomeRepetidoComOSistemaSemAcentoNemCaixa_telefone() {
        Contratante c = novoContratante();
        for (String repetido : List.of("celular", "CELULÁR", "whatsapp")) {
            MvcTestResult r = post("/api/tipos-telefone", c.admin().token(), Map.of("nome", repetido));
            assertThat(status(r)).as(repetido).isEqualTo(409);
            JsonNode erro = corpo(r).path("erros").get(0);
            assertThat(erro.path("campo").asString()).isEqualTo("nome");
            assertThat(erro.path("mensagem").asString()).isEqualTo("Já existe um tipo de telefone com este nome.");
        }
    }

    /** As 2 cópias novas falam no gênero certo: "um estado civil", "uma profissão". */
    @Test
    void mensagensNoGeneroCerto_estadoCivilEProfissao() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String inexistente = java.util.UUID.randomUUID().toString();

        MvcTestResult civil = post("/api/estados-civis", token, Map.of("nome", "uniao ESTÁVEL"));
        assertThat(status(civil)).isEqualTo(409);
        assertThat(corpo(civil).path("erros").get(0).path("mensagem").asString())
                .isEqualTo("Já existe um estado civil com este nome.");
        MvcTestResult civilNaoAchado = put("/api/estados-civis/" + inexistente, token, Map.of("nome", unico("X"), "version", 0));
        assertThat(status(civilNaoAchado)).isEqualTo(404);
        assertThat(corpo(civilNaoAchado).path("detail").asString()).isEqualTo("Estado civil não encontrado.");

        MvcTestResult profissao = post("/api/profissoes", token, Map.of("nome", "SERVIDOR(A) PUBLICO(A)"));
        assertThat(status(profissao)).isEqualTo(409);
        assertThat(corpo(profissao).path("erros").get(0).path("mensagem").asString())
                .isEqualTo("Já existe uma profissão com este nome.");
        MvcTestResult profissaoNaoAchada = patch("/api/profissoes/" + inexistente + "/inativar", token);
        assertThat(status(profissaoNaoAchada)).isEqualTo(404);
        assertThat(corpo(profissaoNaoAchada).path("detail").asString()).isEqualTo("Profissão não encontrada.");
    }

    @ParameterizedTest
    @MethodSource("auxiliares")
    void selecaoSoAtivosEComInativos(Auxiliar a) {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String ativo = corpo(post(a.rota(), token, Map.of("nome", unico("Ativo")))).path("id").asString();
        String inativo = corpo(post(a.rota(), token, Map.of("nome", unico("Inativo")))).path("id").asString();
        assertThat(status(patch(a.rota() + "/" + inativo + "/inativar", token))).isEqualTo(204);

        JsonNode soAtivos = corpo(get(a.rota() + "/selecao", token));
        assertThat(ids(soAtivos)).contains(ativo).doesNotContain(inativo).hasSize(a.quantosDoSistema() + 1);
        List<String> chaves = soAtivos.valueStream()
                .filter(n -> !n.path("chave").isNull()).map(n -> n.path("chave").asString()).toList();
        assertThat(chaves).containsExactlyInAnyOrderElementsOf(a.chaves());

        JsonNode comInativos = corpo(get(a.rota() + "/selecao?inativos=true", token));
        assertThat(ids(comInativos)).contains(ativo, inativo).hasSize(a.quantosDoSistema() + 2);
        JsonNode marcado = comInativos.valueStream().filter(n -> n.path("id").asString().equals(inativo)).findFirst().orElseThrow();
        assertThat(marcado.path("ativo").asBoolean()).isFalse();
        assertThat(marcado.path("chave").isNull()).isTrue();
    }

    // ------------------------------------------------------------ apoio

    private List<String> campos(MvcTestResult r) {
        assertThat(status(r)).as("status com erros de campo").isIn(400, 409);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }

    private List<String> ids(MvcTestResult r) {
        assertThat(status(r)).isEqualTo(200);
        return ids(corpo(r));
    }

    private static List<String> ids(JsonNode n) {
        JsonNode lista = n.has("conteudo") ? n.path("conteudo") : n;
        return lista.valueStream().map(i -> i.path("id").asString()).toList();
    }

    private JsonNode item(MvcTestResult lista, String id) {
        assertThat(status(lista)).isEqualTo(200);
        return corpo(lista).path("conteudo").valueStream()
                .filter(n -> n.path("id").asString().equals(id)).findFirst().orElseThrow();
    }
}
