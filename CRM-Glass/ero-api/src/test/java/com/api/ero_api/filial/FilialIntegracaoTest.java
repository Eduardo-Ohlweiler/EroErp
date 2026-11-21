package com.api.ero_api.filial;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.support.IntegracaoTest;
import jakarta.persistence.EntityManagerFactory;
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
import java.util.stream.LongStream;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Filiais: os 4 obrigatórios, o código por contratante, as regras de matriz e filial (com
 * trava), a lista agrupada, o combo aberto sem documento, a corrida matriz × filha e os
 * CHECKs do banco. Cada teste usa um contratante novo: código e pessoa são por contratante.
 */
class FilialIntegracaoTest extends IntegracaoTest {

    private static final String ROTA = "/api/filiais";

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
        String cnpj = cnpj();
        String nomeMatriz = unico("Matriz Solar");
        String pessoaMatriz = pessoaPJ(token, nomeMatriz, "Solar", cnpj);

        JsonNode m = criar(token, filial(pessoaMatriz, "MATRIZ", null, "#10b981"));
        String idM = m.path("id").asString();
        assertThat(m.path("codFilial").asLong()).isEqualTo(1);
        assertThat(m.path("tipo").asString()).isEqualTo("MATRIZ");
        assertThat(m.path("matriz").isNull()).isTrue();
        assertThat(m.path("cor").asString()).as("em maiúsculas").isEqualTo("#10B981");
        assertThat(m.path("ativo").asBoolean()).isTrue();
        assertThat(m.path("pessoa").path("id").asString()).isEqualTo(pessoaMatriz);
        assertThat(m.path("pessoa").path("tipoPessoa").asString()).isEqualTo("JURIDICA");
        assertThat(m.path("pessoa").path("nome").asString()).isEqualTo(nomeMatriz);
        assertThat(m.path("pessoa").path("nomeFantasia").asString()).isEqualTo("Solar");
        assertThat(m.path("pessoa").path("documento").asString()).isEqualTo(cnpj);
        assertThat(m.path("pessoa").path("ativo").asBoolean()).isTrue();
        assertThat(m.path("criadoPorNome").asString()).isEqualTo("Ana Lima");

        String nomeLoja = unico("Loja Centro");
        JsonNode f = criar(token, filial(pessoaPJ(token, nomeLoja, null, cnpj()), "FILIAL", idM, "#F59E0B"));
        String idF = f.path("id").asString();
        assertThat(f.path("codFilial").asLong()).isEqualTo(2);
        assertThat(f.path("matriz").path("id").asString()).isEqualTo(idM);
        assertThat(f.path("matriz").path("codFilial").asLong()).isEqualTo(1);
        assertThat(f.path("matriz").path("nome").asString()).isEqualTo(nomeMatriz);
        assertThat(f.path("matriz").path("tipo").asString()).isEqualTo("MATRIZ");
        assertThat(f.path("matriz").path("cor").asString()).isEqualTo("#10B981");

        assertThat(ids(get(ROTA, token))).as("a matriz e depois a filial").containsExactly(idM, idF);
        assertThat(corpo(get(ROTA + "/" + idF, token)).path("pessoa").path("nome").asString()).isEqualTo(nomeLoja);

        MvcTestResult alterado = put(ROTA + "/" + idF, token,
                versao(filial(f.path("pessoa").path("id").asString(), "FILIAL", idM, "#3b82f6"), f));
        assertThat(status(alterado)).as(texto(alterado)).isEqualTo(200);
        JsonNode al = corpo(alterado);
        assertThat(al.path("cor").asString()).isEqualTo("#3B82F6");
        assertThat(al.path("version").asLong()).isGreaterThan(f.path("version").asLong());
        assertThat(al.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(al.path("codFilial").asLong()).isEqualTo(2);

        assertThat(status(patch(ROTA + "/" + idF + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + idF + "/inativar", token))).as("já inativa").isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + idM + "/inativar", token))).isEqualTo(204);
        assertThat(ids(get(ROTA + "?ativo=true", token))).isEmpty();
        assertThat(status(patch(ROTA + "/" + idM + "/ativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + idF + "/ativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + idF + "/ativar", token))).as("já ativa").isEqualTo(204);
        assertThat(corpo(get(ROTA + "/" + idF, token)).path("ativo").asBoolean()).isTrue();
        assertThat(corpo(get(ROTA + "/" + idM, token)).path("ativo").asBoolean()).isTrue();
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String pessoa = pessoaPJ(token, unico("Valida"), null, cnpj());

        assertThat(campos(post(ROTA, token, Map.of()))).contains("pessoaId", "tipo", "cor");
        assertThat(campos(post(ROTA, token, filial(pessoa, "MATRIZ", null, "azul")))).containsExactly("cor");
        assertThat(mensagem(post(ROTA, token, filial(pessoa, "MATRIZ", null, "#12345"))))
                .isEqualTo("Cor deve estar no formato #RRGGBB");
        assertThat(campos(post(ROTA, token, filial(pessoa, "MATRIZ", null, "#1234567")))).containsExactly("cor");
        assertThat(campos(post(ROTA, token, filial(null, "MATRIZ", null, "#123456")))).containsExactly("pessoaId");

        MvcTestResult semMatriz = post(ROTA, token, filial(pessoa, "FILIAL", null, "#123456"));
        assertThat(status(semMatriz)).isEqualTo(400);
        assertThat(campos(semMatriz)).containsExactly("matrizId");
        assertThat(mensagem(semMatriz)).isEqualTo("Informe a matriz desta filial.");

        MvcTestResult matrizComMatriz = post(ROTA, token,
                filial(pessoa, "MATRIZ", UUID.randomUUID().toString(), "#123456"));
        assertThat(status(matrizComMatriz)).isEqualTo(400);
        assertThat(campos(matrizComMatriz)).containsExactly("matrizId");
        assertThat(mensagem(matrizComMatriz)).isEqualTo("Matriz não responde a outra matriz. Deixe a matriz em branco.");

        JsonNode m = criar(token, filial(pessoa, "MATRIZ", null, "#123456"));
        assertThat(campos(put(ROTA + "/" + m.path("id").asString(), token, filial(pessoa, "MATRIZ", null, "#123456"))))
                .containsExactly("version");

        assertThat(campos(get(ROTA + "?busca=" + "a".repeat(101), token))).containsExactly("busca");
        assertThat(campos(get(ROTA + "?documento=" + "1".repeat(19), token))).containsExactly("documento");
        assertThat(campos(get(ROTA + "?codFilial=0", token))).containsExactly("codFilial");
        assertThat(campos(get(ROTA + "/selecao?busca=" + "a".repeat(101), token))).containsExactly("busca");
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        String tokenB = cb.admin().token();
        String cnpj = cnpj();
        String nome = unico("DeA");
        String pessoaA = pessoaPJ(tokenA, nome, null, cnpj);
        JsonNode deA = criar(tokenA, filial(pessoaA, "MATRIZ", null, "#123456"));
        String id = deA.path("id").asString();

        assertThat(ids(get(ROTA + "?busca=" + nome, tokenB))).isEmpty();
        assertThat(ids(get(ROTA, tokenB))).isEmpty();
        assertThat(ids(get(ROTA + "/selecao?busca=" + nome, tokenB))).isEmpty();
        assertThat(status(get(ROTA + "/" + id, tokenB))).isEqualTo(404);
        assertThat(status(put(ROTA + "/" + id, tokenB, versao(filial(pessoaA, "MATRIZ", null, "#000000"), deA))))
                .isEqualTo(404);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", tokenB))).isEqualTo(404);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", tokenB))).isEqualTo(404);

        // Pessoa e matriz de outro contratante: 404, como se não existissem.
        MvcTestResult pessoaDeA = post(ROTA, tokenB, filial(pessoaA, "MATRIZ", null, "#123456"));
        assertThat(status(pessoaDeA)).isEqualTo(404);
        assertThat(corpo(pessoaDeA).path("detail").asString()).isEqualTo("Pessoa não encontrada.");
        String pessoaB = pessoaPJ(tokenB, nome, null, cnpj);
        MvcTestResult matrizDeA = post(ROTA, tokenB, filial(pessoaB, "FILIAL", id, "#123456"));
        assertThat(status(matrizDeA)).isEqualTo(404);
        assertThat(corpo(matrizDeA).path("detail").asString()).isEqualTo("Matriz não encontrada.");

        // A mesma pessoa (CNPJ igual) vira filial nos dois contratantes, e em B o código começa do 1.
        JsonNode emB = criar(tokenB, filial(pessoaB, "MATRIZ", null, "#654321"));
        assertThat(emB.path("codFilial").asLong()).isEqualTo(1);
        assertThat(emB.path("pessoa").path("documento").asString()).isEqualTo(cnpj);

        JsonNode visto = corpo(get(ROTA + "/" + id, tokenA));
        assertThat(visto.path("cor").asString()).isEqualTo("#123456");
        assertThat(visto.path("ativo").asBoolean()).isTrue();
        assertThat(visto.path("version").asLong()).isEqualTo(deA.path("version").asLong());
    }

    @Test
    void parLerEscrever() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        String pessoa = pessoaPJ(admin, unico("Alvo"), null, cnpj());
        JsonNode m = criar(admin, filial(pessoa, "MATRIZ", null, "#123456"));
        String id = m.path("id").asString();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get(ROTA, comum.token()))).as("sem o grupo").isEqualTo(403);
        assertThat(status(get(ROTA + "/" + id, comum.token()))).isEqualTo(403);
        assertThat(status(get(ROTA + "/selecao", comum.token()))).as("o combo é de todos").isEqualTo(200);

        liberar(admin, u.id(), List.of(grupo("FILIAIS", "LER")), Set.of());
        assertThat(status(get(ROTA, comum.token()))).isEqualTo(200);
        assertThat(status(get(ROTA + "/" + id, comum.token()))).isEqualTo(200);
        assertThat(status(post(ROTA, comum.token(), filial(pessoa, "MATRIZ", null, "#123456")))).isEqualTo(403);
        assertThat(status(put(ROTA + "/" + id, comum.token(), versao(filial(pessoa, "MATRIZ", null, "#000000"), m))))
                .isEqualTo(403);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", comum.token()))).isEqualTo(403);
        assertThat(status(patch(ROTA + "/" + id + "/ativar", comum.token()))).isEqualTo(403);
        assertThat(status(get("/api/pessoas", comum.token()))).as("Filiais não abre Pessoas").isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("FILIAIS", "ESCREVER")), Set.of());
        MvcTestResult mesmaPessoa = put(ROTA + "/" + id, comum.token(), versao(filial(pessoa, "MATRIZ", null, "#000000"), m));
        assertThat(status(mesmaPessoa)).as("mesma pessoa: a cor muda sem PESSOAS_LER").isEqualTo(200);
        m = corpo(mesmaPessoa);

        // Filial já gravada: sem PESSOAS_LER ainda troca a matriz (a pessoa é a mesma).
        JsonNode outraMatriz = matriz(admin, unico("Outra Matriz"));
        String pessoaFilha = pessoaPJ(admin, unico("Filha"), null, cnpj());
        JsonNode filha = criar(admin, filial(pessoaFilha, "FILIAL", id, "#10B981"));
        MvcTestResult trocaMatriz = put(ROTA + "/" + filha.path("id").asString(), comum.token(),
                versao(filial(pessoaFilha, "FILIAL", outraMatriz.path("id").asString(), "#10B981"), filha));
        assertThat(status(trocaMatriz)).as("mesma pessoa: a matriz muda sem PESSOAS_LER").isEqualTo(200);
        assertThat(corpo(trocaMatriz).path("matriz").path("id").asString()).isEqualTo(outraMatriz.path("id").asString());

        // Escolher pessoa nova sem PESSOAS_LER: 403 antes de buscar (nem dado, nem se o id existe).
        String nomeLivre = unico("Pessoa Sigilosa");
        String livre = pessoaPJ(admin, nomeLivre, null, cnpj());
        String inexistente = UUID.randomUUID().toString();
        MvcTestResult semLer = post(ROTA, comum.token(), filial(livre, "MATRIZ", null, "#123456"));
        assertThat(status(semLer)).as("criar sem PESSOAS_LER").isEqualTo(403);
        assertThat(corpo(semLer).path("codigo").asString()).isEqualTo("ACESSO_NEGADO");
        assertThat(texto(semLer)).doesNotContain(nomeLivre);
        assertThat(status(post(ROTA, comum.token(), filial(inexistente, "MATRIZ", null, "#123456"))))
                .as("id inexistente também 403, não 404").isEqualTo(403);
        assertThat(status(post(ROTA, comum.token(), filial(pessoa, "MATRIZ", null, "#123456"))))
                .as("pessoa já filial também 403, não 409").isEqualTo(403);
        assertThat(status(put(ROTA + "/" + id, comum.token(), versao(filial(livre, "MATRIZ", null, "#000000"), m))))
                .as("trocar a pessoa sem PESSOAS_LER").isEqualTo(403);
        assertThat(status(put(ROTA + "/" + id, comum.token(), versao(filial(inexistente, "MATRIZ", null, "#000000"), m))))
                .isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("FILIAIS", "ESCREVER"), grupo("PESSOAS", "LER")), Set.of());
        String outraLivre = pessoaPJ(admin, unico("Livre"), null, cnpj());
        assertThat(status(post(ROTA, comum.token(), filial(outraLivre, "MATRIZ", null, "#123456"))))
                .as("com PESSOAS_LER cria").isEqualTo(201);
        assertThat(status(put(ROTA + "/" + id, comum.token(), versao(filial(livre, "MATRIZ", null, "#000000"), m))))
                .as("com PESSOAS_LER troca a pessoa").isEqualTo(200);

        // Na visão de plataforma o filtro de tenant não vale: nada de ler nem gravar.
        Sessao s = loginSuperadmin();
        assertThat(status(get(ROTA, s.token()))).isEqualTo(422);
        assertThat(status(get(ROTA + "/selecao", s.token()))).isEqualTo(422);
        assertThat(status(get(ROTA + "/" + id, s.token()))).isEqualTo(422);
        assertThat(status(post(ROTA, s.token(), filial(pessoa, "MATRIZ", null, "#123456")))).isEqualTo(422);
        assertThat(status(patch(ROTA + "/" + id + "/inativar", s.token()))).isEqualTo(422);
    }

    // ------------------------------------------------------------ código

    @Test
    void codigo_primeiro1_segundo2_porContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        String tokenB = cb.admin().token();
        assertThat(matriz(tokenA, unico("Um")).path("codFilial").asLong()).isEqualTo(1);
        assertThat(matriz(tokenA, unico("Dois")).path("codFilial").asLong()).isEqualTo(2);
        assertThat(matriz(tokenB, unico("Outro")).path("codFilial").asLong()).isEqualTo(1);
    }

    @Test
    void codigo_ignoradoNoCorpo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String pessoa = pessoaPJ(token, unico("Cod"), null, cnpj());
        JsonNode m = criar(token, com(filial(pessoa, "MATRIZ", null, "#123456"),
                "codFilial", 999, "id", UUID.randomUUID().toString()));
        assertThat(m.path("codFilial").asLong()).isEqualTo(1);
        JsonNode al = corpo(put(ROTA + "/" + m.path("id").asString(), token,
                versao(com(filial(pessoa, "MATRIZ", null, "#654321"), "codFilial", 777), m)));
        assertThat(al.path("codFilial").asLong()).isEqualTo(1);
    }

    /**
     * Dois cadastros ao mesmo tempo leem o mesmo maior + 1; o índice único recusa o
     * segundo e o {@code RepetirSeCodigoRepetido} tenta de novo numa transação nova.
     */
    @Test
    void codigo_doisCriarSimultaneosSem409() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        List<Long> codigos = new ArrayList<>();
        for (int rodada = 0; rodada < 8; rodada++) {
            String p1 = pessoaPJ(token, unico("Par"), null, cnpj());
            String p2 = pessoaPJ(token, unico("Par"), null, cnpj());
            CountDownLatch largada = new CountDownLatch(1);
            List<MvcTestResult> resultados = emParalelo(largada,
                    () -> {
                        largada.await();
                        return post(ROTA, token, filial(p1, "MATRIZ", null, "#123456"));
                    },
                    () -> {
                        largada.await();
                        return post(ROTA, token, filial(p2, "MATRIZ", null, "#123456"));
                    });
            for (MvcTestResult r : resultados) {
                assertThat(status(r)).as("rodada %d: %s", rodada, texto(r)).isEqualTo(201);
                codigos.add(corpo(r).path("codFilial").asLong());
            }
        }
        assertThat(codigos).as("sem buraco nem repetição")
                .containsExactlyInAnyOrderElementsOf(LongStream.rangeClosed(1, 16).boxed().toList());
    }

    @Test
    void filtroCodigoNaoAchaOutroContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        matriz(ca.admin().token(), unico("A1"));
        matriz(ca.admin().token(), unico("A2"));
        String deB = matriz(cb.admin().token(), unico("B1")).path("id").asString();

        assertThat(ids(get(ROTA + "?codFilial=2", cb.admin().token()))).isEmpty();
        assertThat(ids(get(ROTA + "?codFilial=1", cb.admin().token()))).containsExactly(deB);
    }

    // ------------------------------------------------------------ regras

    @Test
    void pessoaJaFilial409ComCampoECodigo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        JsonNode m = matriz(token, unico("Dona"));
        String pessoa = m.path("pessoa").path("id").asString();

        MvcTestResult repetida = post(ROTA, token, filial(pessoa, "MATRIZ", null, "#123456"));
        assertThat(status(repetida)).isEqualTo(409);
        assertThat(campos(repetida)).containsExactly("pessoaId");
        assertThat(mensagem(repetida)).isEqualTo("Esta pessoa já é a filial código 1.");

        JsonNode outra = matriz(token, unico("Outra"));
        MvcTestResult noPut = put(ROTA + "/" + outra.path("id").asString(), token,
                versao(filial(pessoa, "MATRIZ", null, "#123456"), outra));
        assertThat(status(noPut)).isEqualTo(409);
        assertThat(campos(noPut)).containsExactly("pessoaId");
        assertThat(mensagem(noPut)).isEqualTo("Esta pessoa já é a filial código 1.");
    }

    @Test
    void pessoaInativa409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String pessoa = pessoaPJ(token, unico("Fechada"), null, cnpj());
        assertThat(status(patch("/api/pessoas/" + pessoa + "/inativar", token))).isEqualTo(204);

        MvcTestResult r = post(ROTA, token, filial(pessoa, "MATRIZ", null, "#123456"));
        assertThat(status(r)).isEqualTo(409);
        assertThat(campos(r)).containsExactly("pessoaId");
        assertThat(mensagem(r)).isEqualTo("Esta pessoa está inativa.");
    }

    @Test
    void matrizQueEhFilial409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        String f = filialDe(token, unico("F"), m).path("id").asString();

        MvcTestResult r = post(ROTA, token, filial(pessoaPJ(token, unico("Neta"), null, cnpj()), "FILIAL", f, "#123456"));
        assertThat(status(r)).isEqualTo(409);
        assertThat(campos(r)).containsExactly("matrizId");
        assertThat(mensagem(r)).isEqualTo("A matriz escolhida é uma filial. Escolha uma matriz.");
    }

    @Test
    void matrizInativa409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        assertThat(status(patch(ROTA + "/" + m + "/inativar", token))).isEqualTo(204);

        MvcTestResult r = post(ROTA, token, filial(pessoaPJ(token, unico("F"), null, cnpj()), "FILIAL", m, "#123456"));
        assertThat(status(r)).isEqualTo(409);
        assertThat(campos(r)).containsExactly("matrizId");
        assertThat(mensagem(r)).isEqualTo("A matriz escolhida está inativa.");
    }

    @Test
    void propriaComoMatriz400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        JsonNode f = filialDe(token, unico("F"), m);
        String idF = f.path("id").asString();

        MvcTestResult r = put(ROTA + "/" + idF, token,
                versao(filial(f.path("pessoa").path("id").asString(), "FILIAL", idF, "#123456"), f));
        assertThat(status(r)).isEqualTo(400);
        assertThat(campos(r)).containsExactly("matrizId");
        assertThat(mensagem(r)).isEqualTo("A filial não pode ser a própria matriz.");

        JsonNode sozinha = matriz(token, unico("Sozinha"));
        MvcTestResult daMatriz = put(ROTA + "/" + sozinha.path("id").asString(), token,
                versao(filial(sozinha.path("pessoa").path("id").asString(), "FILIAL", sozinha.path("id").asString(),
                        "#123456"), sozinha));
        assertThat(status(daMatriz)).isEqualTo(400);
        assertThat(campos(daMatriz)).containsExactly("matrizId");
    }

    @Test
    void matrizComFilhasNaoViraFilial409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        JsonNode m = matriz(token, unico("Mae"));
        String idM = m.path("id").asString();
        filialDe(token, unico("Filha"), idM);
        String outra = matriz(token, unico("Outra")).path("id").asString();

        MvcTestResult r = put(ROTA + "/" + idM, token,
                versao(filial(m.path("pessoa").path("id").asString(), "FILIAL", outra, "#123456"), m));
        assertThat(status(r)).isEqualTo(409);
        assertThat(campos(r)).containsExactly("tipo");
        assertThat(mensagem(r)).isEqualTo("Esta matriz tem 1 filial. Mude a matriz delas antes de transformá-la em filial.");

        // Sem filhas, a matriz vira filial de outra matriz.
        JsonNode livre = matriz(token, unico("Livre"));
        JsonNode virou = corpo(put(ROTA + "/" + livre.path("id").asString(), token,
                versao(filial(livre.path("pessoa").path("id").asString(), "FILIAL", outra, "#123456"), livre)));
        assertThat(virou.path("tipo").asString()).isEqualTo("FILIAL");
        assertThat(virou.path("matriz").path("id").asString()).isEqualTo(outra);

        // E a filial volta a ser matriz: a matriz some.
        JsonNode voltou = corpo(put(ROTA + "/" + livre.path("id").asString(), token,
                versao(filial(livre.path("pessoa").path("id").asString(), "MATRIZ", null, "#123456"), virou)));
        assertThat(voltou.path("tipo").asString()).isEqualTo("MATRIZ");
        assertThat(voltou.path("matriz").isNull()).isTrue();
    }

    @Test
    void inativarMatrizComFilialAtiva409ComContagem() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        String f1 = filialDe(token, unico("F1"), m).path("id").asString();

        MvcTestResult uma = patch(ROTA + "/" + m + "/inativar", token);
        assertThat(status(uma)).isEqualTo(409);
        assertThat(corpo(uma).path("detail").asString()).isEqualTo("Esta matriz tem 1 filial ativa. Inative-a antes.");
        assertThat(corpo(uma).has("erros")).as("sem campo: sai em aviso").isFalse();

        String f2 = filialDe(token, unico("F2"), m).path("id").asString();
        MvcTestResult duas = patch(ROTA + "/" + m + "/inativar", token);
        assertThat(status(duas)).isEqualTo(409);
        assertThat(corpo(duas).path("detail").asString()).isEqualTo("Esta matriz tem 2 filiais ativas. Inative-as antes.");

        assertThat(status(patch(ROTA + "/" + f1 + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + f2 + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + m + "/inativar", token))).as("só com filiais inativas").isEqualTo(204);
    }

    @Test
    void reativarFilialDeMatrizInativa409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        String f = filialDe(token, unico("F"), m).path("id").asString();
        assertThat(status(patch(ROTA + "/" + f + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + m + "/inativar", token))).isEqualTo(204);

        MvcTestResult r = patch(ROTA + "/" + f + "/ativar", token);
        assertThat(status(r)).isEqualTo(409);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("A matriz desta filial está inativa. Reative a matriz antes.");
        assertThat(corpo(get(ROTA + "/" + f, token)).path("ativo").asBoolean()).isFalse();
    }

    /** A matriz que já estava não é reconferida (decisão do 2.0). */
    @Test
    void filialInativaDeMatrizInativaAindaTrocaCor200() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String m = matriz(token, unico("M")).path("id").asString();
        JsonNode f = filialDe(token, unico("F"), m);
        String idF = f.path("id").asString();
        assertThat(status(patch(ROTA + "/" + idF + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch(ROTA + "/" + m + "/inativar", token))).isEqualTo(204);
        JsonNode atual = corpo(get(ROTA + "/" + idF, token));

        MvcTestResult r = put(ROTA + "/" + idF, token,
                versao(filial(f.path("pessoa").path("id").asString(), "FILIAL", m, "#ec4899"), atual));
        assertThat(status(r)).as(texto(r)).isEqualTo(200);
        assertThat(corpo(r).path("cor").asString()).isEqualTo("#EC4899");
        assertThat(corpo(r).path("ativo").asBoolean()).isFalse();
    }

    @Test
    void trocarPessoaExigePessoaLivreEAtiva() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        JsonNode m = matriz(token, unico("M"));
        String idM = m.path("id").asString();
        JsonNode f = filialDe(token, unico("F"), idM);
        String idF = f.path("id").asString();

        MvcTestResult jaFilial = put(ROTA + "/" + idF, token,
                versao(filial(m.path("pessoa").path("id").asString(), "FILIAL", idM, "#123456"), f));
        assertThat(campos(jaFilial)).containsExactly("pessoaId");
        assertThat(mensagem(jaFilial)).isEqualTo("Esta pessoa já é a filial código 1.");

        String inativa = pessoaPJ(token, unico("Inativa"), null, cnpj());
        assertThat(status(patch("/api/pessoas/" + inativa + "/inativar", token))).isEqualTo(204);
        MvcTestResult comInativa = put(ROTA + "/" + idF, token, versao(filial(inativa, "FILIAL", idM, "#123456"), f));
        assertThat(campos(comInativa)).containsExactly("pessoaId");
        assertThat(mensagem(comInativa)).isEqualTo("Esta pessoa está inativa.");

        String livre = pessoaPJ(token, unico("Livre"), null, cnpj());
        JsonNode trocada = corpo(put(ROTA + "/" + idF, token, versao(filial(livre, "FILIAL", idM, "#123456"), f)));
        assertThat(trocada.path("pessoa").path("id").asString()).isEqualTo(livre);

        // A pessoa que não mudou não é reconferida: inativa, a filial ainda troca a cor.
        assertThat(status(patch("/api/pessoas/" + livre + "/inativar", token))).isEqualTo(204);
        MvcTestResult mesma = put(ROTA + "/" + idF, token, versao(filial(livre, "FILIAL", idM, "#654321"), trocada));
        assertThat(status(mesma)).as(texto(mesma)).isEqualTo(200);
        assertThat(corpo(mesma).path("pessoa").path("ativo").asBoolean()).as("o aviso 'Pessoa inativa'").isFalse();
    }

    @Test
    void versaoAntiga409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        JsonNode m = matriz(token, unico("M"));
        String id = m.path("id").asString();
        String pessoa = m.path("pessoa").path("id").asString();
        assertThat(status(put(ROTA + "/" + id, token, versao(filial(pessoa, "MATRIZ", null, "#111111"), m))))
                .isEqualTo(200);

        MvcTestResult velha = put(ROTA + "/" + id, token, versao(filial(pessoa, "MATRIZ", null, "#222222"), m));
        assertThat(status(velha)).isEqualTo(409);
        assertThat(corpo(velha).path("detail").asString())
                .isEqualTo("Esta filial foi alterada por outro usuário. Recarregue e tente de novo.");
        assertThat(corpo(velha).has("erros")).as("versão sai sem campo").isFalse();
        assertThat(corpo(get(ROTA + "/" + id, token)).path("cor").asString()).isEqualTo("#111111");
    }

    @Test
    void sortRecusado422() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        assertThat(status(get(ROTA + "?sort=codFilial", token))).isEqualTo(422);
        assertThat(status(get(ROTA + "?sort=cor,desc", token))).isEqualTo(422);
        assertThat(status(get(ROTA, token))).isEqualTo(200);
    }

    // ------------------------------------------------------------ lista e seleção

    /** Cada matriz seguida das suas filiais, as matrizes por nome, mesmo quando o nome da filial cruza a ordem. */
    @Test
    void ordemAgrupada() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String p = unico("Ordem");
        String beta = matriz(token, p + " Beta").path("id").asString();
        String alfa = matriz(token, p + " Alfa").path("id").asString();
        String betaC = filialDe(token, p + " Ccc", beta).path("id").asString();
        String betaA = filialDe(token, p + " Aaa", beta).path("id").asString();
        String alfaZ = filialDe(token, p + " Zzz", alfa).path("id").asString();

        assertThat(ids(get(ROTA, token))).containsExactly(alfa, alfaZ, beta, betaA, betaC);
        assertThat(ids(get(ROTA + "?size=2&page=1", token))).as("a ordem vale entre páginas").containsExactly(beta, betaA);
    }

    @Test
    void filtros() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String cnpj = cnpj();
        String cpf = cpf();
        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        String m1 = criar(token, filial(pessoaPJ(token, "São Bento " + sufixo, "Padaria Ótima " + sufixo, cnpj),
                "MATRIZ", null, "#123456")).path("id").asString();
        String f = criar(token, filial(pessoaPF(token, "Joana Araújo " + sufixo, cpf), "FILIAL", m1, "#123456"))
                .path("id").asString();
        String m3 = matriz(token, "Zeta " + sufixo).path("id").asString();
        assertThat(status(patch(ROTA + "/" + m3 + "/inativar", token))).isEqualTo(204);

        assertThat(ids(get(ROTA + "?busca=SAO bento", token))).as("sem acento nem caixa").containsExactly(m1);
        assertThat(ids(get(ROTA + "?busca=otima " + sufixo, token))).as("pela fantasia").containsExactly(m1);
        assertThat(ids(get(ROTA + "?busca=araujo", token))).containsExactly(f);
        assertThat(ids(get(ROTA + "?documento=" + mascararCnpj(cnpj).substring(0, 10), token)))
                .as("CNPJ parcial com máscara").containsExactly(m1);
        assertThat(ids(get(ROTA + "?documento=" + mascararCpf(cpf).substring(4, 11), token)))
                .as("CPF parcial com máscara").containsExactly(f);
        assertThat(ids(get(ROTA + "?tipo=MATRIZ", token))).containsExactlyInAnyOrder(m1, m3);
        assertThat(ids(get(ROTA + "?tipo=FILIAL", token))).containsExactly(f);
        assertThat(ids(get(ROTA + "?ativo=true", token))).containsExactly(m1, f);
        assertThat(ids(get(ROTA + "?ativo=false", token))).containsExactly(m3);
        assertThat(ids(get(ROTA + "?codFilial=2", token))).containsExactly(f);
        assertThat(ids(get(ROTA + "?busca=&documento=&tipo=&ativo=", token))).as("todos vazios")
                .containsExactly(m1, f, m3);
        assertThat(ids(get(ROTA, token))).containsExactly(m1, f, m3);
    }

    @Test
    void selecaoSoAtivasPorTipoEIgnoraId() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String p = unico("Combo");
        String m1 = matriz(token, p + " A").path("id").asString();
        String m2 = matriz(token, p + " B").path("id").asString();
        String m3 = matriz(token, p + " C").path("id").asString();
        String f = filialDe(token, p + " D", m1).path("id").asString();
        assertThat(status(patch(ROTA + "/" + m3 + "/inativar", token))).isEqualTo(204);

        assertThat(ids(get(ROTA + "/selecao", token))).as("só as ativas, por nome").containsExactly(m1, m2, f);
        assertThat(ids(get(ROTA + "/selecao?tipo=MATRIZ", token))).containsExactly(m1, m2);
        assertThat(ids(get(ROTA + "/selecao?tipo=MATRIZ&ignorarId=" + m1, token))).containsExactly(m2);
        assertThat(ids(get(ROTA + "/selecao?tipo=FILIAL", token))).containsExactly(f);
        assertThat(ids(get(ROTA + "/selecao?busca=" + p.toUpperCase() + " b", token))).containsExactly(m2);
    }

    /** O /selecao é aberto a quem está logado: sem CPF nem CNPJ. */
    @Test
    void selecaoSemDocumento() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        String nome = unico("Pessoa Fisica");
        String m = criar(token, filial(pessoaPF(token, nome, cpf()), "MATRIZ", null, "#a1b2c3")).path("id").asString();

        JsonNode item = corpo(get(ROTA + "/selecao", token)).get(0);
        assertThat(item.path("id").asString()).isEqualTo(m);
        assertThat(item.path("codFilial").asLong()).isEqualTo(1);
        assertThat(item.path("nome").asString()).isEqualTo(nome);
        assertThat(item.path("tipo").asString()).isEqualTo("MATRIZ");
        assertThat(item.path("cor").asString()).isEqualTo("#A1B2C3");
        assertThat(item.has("documento")).isFalse();
        assertThat(item.has("cpf")).isFalse();
        assertThat(item.has("cnpj")).isFalse();
        assertThat(item.size()).as("id, código, nome, tipo e cor").isEqualTo(5);
    }

    /** A lista não cai em N+1: página (com pessoa e matriz), contagem e nomes = no máximo 3 comandos. */
    @Test
    void listaSemNMais1() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        for (int i = 0; i < 2; i++) {
            String m = matriz(token, unico("Lote M" + i)).path("id").asString();
            filialDe(token, unico("Lote F" + i), m);
            filialDe(token, unico("Lote G" + i), m);
        }
        Statistics estatisticas = emf.unwrap(SessionFactory.class).getStatistics();
        boolean ligadas = estatisticas.isStatisticsEnabled();
        estatisticas.setStatisticsEnabled(true);
        try {
            assertThat(status(get(ROTA + "?size=2", token))).isEqualTo(200);
            long comDuas = comandos(estatisticas, ROTA + "?size=2", token, 2);
            long comQuatro = comandos(estatisticas, ROTA + "?size=4", token, 4);
            assertThat(comQuatro).as("mesmo número de comandos com mais linhas").isEqualTo(comDuas);
            assertThat(comQuatro).as("página, contagem e nomes da auditoria").isLessThanOrEqualTo(3);
        } finally {
            estatisticas.setStatisticsEnabled(ligadas);
        }
    }

    // ------------------------------------------------------------ concorrência e banco

    /**
     * Criar uma filial em M e inativar M ao mesmo tempo: os dois travam a linha de M antes
     * de conferir, então um passa e o outro recebe 409. Nunca filial ativa em matriz inativa.
     */
    @Test
    void criarFilialEInativarMatrizAoMesmoTempo() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        for (int rodada = 0; rodada < 6; rodada++) {
            String m = matriz(token, unico("Corrida M")).path("id").asString();
            String pessoa = pessoaPJ(token, unico("Corrida F"), null, cnpj());
            CountDownLatch largada = new CountDownLatch(1);
            List<MvcTestResult> resultados = emParalelo(largada,
                    () -> {
                        largada.await();
                        return post(ROTA, token, filial(pessoa, "FILIAL", m, "#123456"));
                    },
                    () -> {
                        largada.await();
                        return patch(ROTA + "/" + m + "/inativar", token);
                    });
            int criar = status(resultados.get(0));
            int inativar = status(resultados.get(1));
            String como = "rodada " + rodada + ": " + texto(resultados.get(0)) + " / " + texto(resultados.get(1));
            assertThat(criar).as(como).isIn(201, 409);
            assertThat(inativar).as(como).isIn(204, 409);
            assertThat(criar == 201 ^ inativar == 204).as("um passa, o outro recebe 409: %s", como).isTrue();

            boolean matrizAtiva = corpo(get(ROTA + "/" + m, token)).path("ativo").asBoolean();
            List<String> filhasAtivas = ids(get(ROTA + "?tipo=FILIAL&ativo=true", token)).stream()
                    .filter(id -> corpo(get(ROTA + "/" + id, token)).path("matriz").path("id").asString().equals(m))
                    .toList();
            assertThat(!matrizAtiva && !filhasAtivas.isEmpty()).as("filial ativa em matriz inativa: %s", como).isFalse();
        }
    }

    /** As restrições do banco seguram mesmo sem passar pelo Java. */
    @Test
    void checksDoBanco() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        UUID m1 = UUID.fromString(matriz(token, unico("M1")).path("id").asString());
        UUID m2 = UUID.fromString(matriz(token, unico("M2")).path("id").asString());
        UUID f = UUID.fromString(filialDe(token, unico("F"), m1.toString()).path("id").asString());

        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET matriz_id = ? WHERE id = ?", m2, m1))
                .as("MATRIZ com matriz").hasMessageContaining("ck_filial_tipo_matriz");
        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET matriz_id = NULL WHERE id = ?", f))
                .as("FILIAL sem matriz").hasMessageContaining("ck_filial_tipo_matriz");
        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET matriz_id = id WHERE id = ?", f))
                .as("a própria matriz").hasMessageContaining("ck_filial_matriz_outra");
        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET cor = '#a1b2c3' WHERE id = ?", f))
                .as("cor em minúsculas").hasMessageContaining("ck_filial_cor");
        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET cor = 'red;x' WHERE id = ?", f))
                .hasMessageContaining("ck_filial_cor");
        assertThatThrownBy(() -> jdbc.update("UPDATE filial SET tipo = 'OUTRO' WHERE id = ?", f))
                .hasMessageContaining("ck_filial_tipo");
    }

    // ------------------------------------------------------------ apoio

    private static Map<String, Object> filial(String pessoaId, String tipo, String matrizId, String cor) {
        Map<String, Object> m = new HashMap<>();
        m.put("pessoaId", pessoaId);
        m.put("tipo", tipo);
        m.put("matrizId", matrizId);
        m.put("cor", cor);
        return m;
    }

    /** Uma pessoa jurídica nova e a matriz dela. */
    private JsonNode matriz(String token, String nome) {
        return criar(token, filial(pessoaPJ(token, nome, null, cnpj()), "MATRIZ", null, "#3B82F6"));
    }

    /** Uma pessoa jurídica nova e a filial dela, na matriz indicada. */
    private JsonNode filialDe(String token, String nome, String matrizId) {
        return criar(token, filial(pessoaPJ(token, nome, null, cnpj()), "FILIAL", matrizId, "#10B981"));
    }

    private JsonNode criar(String token, Map<String, Object> corpo) {
        MvcTestResult r = post(ROTA, token, corpo);
        assertThat(status(r)).as("criar filial: %s", texto(r)).isEqualTo(201);
        return corpo(r);
    }

    private String pessoaPJ(String token, String nome, String fantasia, String cnpj) {
        return pessoa(token, com(base("JURIDICA", nome, token), "nomeFantasia", fantasia, "cnpj", cnpj));
    }

    private String pessoaPF(String token, String nome, String cpf) {
        return pessoa(token, com(base("FISICA", nome, token), "cpf", cpf));
    }

    private String pessoa(String token, Map<String, Object> corpo) {
        MvcTestResult r = post("/api/pessoas", token, corpo);
        assertThat(status(r)).as("criar pessoa: %s", texto(r)).isEqualTo(201);
        return corpo(r).path("id").asString();
    }

    private Map<String, Object> base(String tipoPessoa, String nome, String token) {
        Map<String, Object> m = new HashMap<>();
        m.put("tipoPessoa", tipoPessoa);
        m.put("nome", nome);
        m.put("tiposCadastroIds", List.of(cliente(token)));
        m.put("telefones", List.of());
        m.put("emails", List.of());
        m.put("redesSociais", List.of());
        m.put("enderecos", List.of());
        m.put("vinculos", List.of());
        return m;
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

    /** CPF válido sorteado (11 dígitos, sem máscara). */
    private static String cpf() {
        while (true) {
            int[] d = new int[11];
            for (int i = 0; i < 9; i++) {
                d[i] = ThreadLocalRandom.current().nextInt(10);
            }
            d[9] = digitoCpf(d, 9);
            d[10] = digitoCpf(d, 10);
            StringBuilder s = new StringBuilder();
            for (int x : d) {
                s.append(x);
            }
            if (s.chars().distinct().count() > 1) {
                return s.toString();
            }
        }
    }

    private static int digitoCpf(int[] d, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += d[i] * (quantidade + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
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

    private static String mascararCpf(String cpf) {
        return cpf.substring(0, 3) + "." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-" + cpf.substring(9);
    }

    private static String mascararCnpj(String cnpj) {
        return cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "." + cnpj.substring(5, 8) + "/"
                + cnpj.substring(8, 12) + "-" + cnpj.substring(12);
    }
}
