package com.api.ero_erp.estoque;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Estoque de produto por filial: cadastro (preço, controle, mínimo),
 * entrada, ajuste com sinal, transferência e o histórico. No antigo o saldo
 * vazava entre tenants, o ajuste perdia o sinal e duas baixas simultâneas
 * perdiam uma.
 */
@DisplayName("Estoque")
class EstoqueTest extends AbstractIntegrationTest {

    private String token;
    private UUID loja;
    private UUID centro;
    private UUID parafuso;

    @BeforeEach
    void preparar() throws Exception {
        token = autenticar(adminA.getEmail());
        loja = criarMatriz(token, salvarPessoa(tenantA, "Loja Matriz").getId());
        centro = criarMatriz(token, salvarPessoa(tenantA, "Loja Centro").getId());
        parafuso = criarProduto(token, "Parafuso");
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("abre com preço, mínimo e saldo inicial; o saldo inicial vira uma ENTRADA")
    void criaComSaldoInicial() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, "1.50", true, "10", "25.5")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoNome").value("Parafuso"))
                .andExpect(jsonPath("$.unidadeSigla").value("UN"))
                .andExpect(jsonPath("$.filialNome").value("Loja Matriz"))
                .andExpect(jsonPath("$.quantidade").value(25.5))
                .andExpect(jsonPath("$.precoVenda").value(1.5))
                .andExpect(jsonPath("$.quantidadeMinima").value(10))
                .andExpect(jsonPath("$.controlaEstoque").value(true)));

        movimentos(id)
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.content[0].quantidade").value(25.5))
                .andExpect(jsonPath("$.content[0].quantidadeAnterior").value(0))
                .andExpect(jsonPath("$.content[0].motivo").value("Saldo inicial"));
    }

    @Test
    @DisplayName("preço vazio fica vazio e sem saldo inicial não há movimento")
    void vazioNaoEZero() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, null, true, null, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.precoVenda").doesNotExist())
                .andExpect(jsonPath("$.quantidadeMinima").doesNotExist())
                .andExpect(jsonPath("$.quantidade").value(0)));
        movimentos(id).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("o mesmo produto duas vezes na filial é 409; em outra filial, passa")
    void umaLinhaPorFilial() throws Exception {
        abrir(loja, parafuso, null, true, null, null).andExpect(status().isCreated());
        abrir(loja, parafuso, null, true, null, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O produto Parafuso já tem estoque na filial Loja Matriz"));
        abrir(centro, parafuso, null, false, null, null).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("sem controle de estoque não há saldo inicial")
    void semControleSemSaldoInicial() throws Exception {
        abrir(loja, parafuso, "2", false, null, "5")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Sem controle de estoque não há quantidade inicial"));
        assertThat(estoqueRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("produto inativo e filial inativa não abrem estoque")
    void inativosNaoAbrem() throws Exception {
        mockMvc.perform(patch("/filiais/{id}/ativo", centro).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());
        abrir(centro, parafuso, null, true, null, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("A filial Loja Centro está inativa"));

        mockMvc.perform(patch("/produtos/{id}/ativo", parafuso).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());
        abrir(loja, parafuso, null, true, null, null).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("alterar o cadastro não toca na quantidade, e inativar não apaga o mínimo")
    void alterarNaoTocaQuantidade() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, "1.50", true, "10", "7"));

        alterar(id, "2.00", true, "10")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precoVenda").value(2.0))
                .andExpect(jsonPath("$.quantidadeMinima").value(10))
                .andExpect(jsonPath("$.quantidade").value(7));

        // Inativar não leva o mínimo junto — no antigo, levava
        mockMvc.perform(patch("/estoques/{id}/ativo", id).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeMinima").value(10))
                .andExpect(jsonPath("$.ativo").value(false));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Entrada e ajuste
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("entrada soma; zero ou negativa é 400")
    void entrada() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, null, true, null, "10"));

        entrada(id, "2.5", "Compra avulsa")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.quantidade").value(2.5))
                .andExpect(jsonPath("$.quantidadeAnterior").value(10))
                .andExpect(jsonPath("$.quantidadePosterior").value(12.5));

        entrada(id, "0", null).andExpect(status().isBadRequest());
        entrada(id, "-1", null).andExpect(status().isBadRequest());
        entrada(id, "1.0001", null).andExpect(status().isBadRequest());

        saldo(id).andExpect(jsonPath("$.quantidade").value(12.5));
    }

    @Test
    @DisplayName("ajuste grava a diferença COM SINAL; igual ao atual e sem motivo são 400")
    void ajusteComSinal() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, null, true, null, "10"));

        ajuste(id, "7", "Contagem de outubro")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("AJUSTE"))
                .andExpect(jsonPath("$.quantidade").value(-3))
                .andExpect(jsonPath("$.quantidadeAnterior").value(10))
                .andExpect(jsonPath("$.quantidadePosterior").value(7));
        ajuste(id, "9", "Achado no depósito")
                .andExpect(jsonPath("$.quantidade").value(2));

        ajuste(id, "9", "Nada mudou")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A quantidade nova é igual à atual: não há o que ajustar"));
        ajuste(id, "1", " ").andExpect(status().isBadRequest());
        ajuste(id, "-1", "Negativo").andExpect(status().isBadRequest());

        saldo(id).andExpect(jsonPath("$.quantidade").value(9));
    }

    @Test
    @DisplayName("sem controle de estoque: não se movimenta e não aparece no combo das movimentações")
    void semControleNaoMovimenta() throws Exception {
        UUID semControle = idDe(abrir(loja, parafuso, "3", false, null, null));
        UUID porca = criarProduto(token, "Porca");
        abrir(loja, porca, null, true, null, null).andExpect(status().isCreated());

        entrada(semControle, "1", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O produto Parafuso não controla estoque na filial Loja Matriz"));
        ajuste(semControle, "1", "Contagem").andExpect(status().isConflict());

        mockMvc.perform(get("/estoques/movimentaveis").header(AUTHORIZATION, token).param("filialId", loja.toString()))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].produtoNome").value("Porca"));

        // Mas o preço e a situação continuam normais, e a lista mostra a linha
        alterar(semControle, "4.00", false, null).andExpect(jsonPath("$.precoVenda").value(4.0));
        mockMvc.perform(get("/estoques").header(AUTHORIZATION, token).param("controla", "false"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("linha inativa e produto inativo não se movimentam")
    void inativosNaoMovimentam() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, null, true, null, "5"));

        mockMvc.perform(patch("/estoques/{id}/ativo", id).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());
        entrada(id, "1", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O estoque de Parafuso na filial Loja Matriz está inativo"));

        mockMvc.perform(patch("/estoques/{id}/ativo", id).header(AUTHORIZATION, token).param("ativo", "true"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/produtos/{id}/ativo", parafuso).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());
        entrada(id, "1", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O produto Parafuso está inativo"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Transferência
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("transferência: dois movimentos ligados, com sinais opostos; o destino sem linha ganha uma")
    void transferencia() throws Exception {
        UUID origem = idDe(abrir(loja, parafuso, "1.50", true, null, "10"));

        transferir(parafuso, loja, centro, "4", "Reposição")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].tipo").value("TRANSFERENCIA_SAIDA"))
                .andExpect(jsonPath("$[0].quantidade").value(-4))
                .andExpect(jsonPath("$[0].filialContraparteNome").value("Loja Centro"))
                .andExpect(jsonPath("$[1].tipo").value("TRANSFERENCIA_ENTRADA"))
                .andExpect(jsonPath("$[1].quantidade").value(4))
                .andExpect(jsonPath("$[1].filialNome").value("Loja Centro"))
                .andExpect(jsonPath("$[1].filialContraparteNome").value("Loja Matriz"));

        saldo(origem).andExpect(jsonPath("$.quantidade").value(6));
        mockMvc.perform(get("/estoques").header(AUTHORIZATION, token).param("filialId", centro.toString()))
                .andExpect(jsonPath("$.content[0].quantidade").value(4))
                // A linha nova nasce com controle e sem preço
                .andExpect(jsonPath("$.content[0].controlaEstoque").value(true))
                .andExpect(jsonPath("$.content[0].precoVenda").doesNotExist());

        // Os dois movimentos têm o mesmo transferenciaId
        String corpo = mockMvc.perform(get("/estoques/movimentacoes").header(AUTHORIZATION, token)
                        .param("tipo", "TRANSFERENCIA_SAIDA"))
                .andReturn().getResponse().getContentAsString();
        String transferenciaId = objectMapper.readTree(corpo).at("/content/0/transferenciaId").asText();
        String corpoEntrada = mockMvc.perform(get("/estoques/movimentacoes").header(AUTHORIZATION, token)
                        .param("tipo", "TRANSFERENCIA_ENTRADA"))
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(corpoEntrada).at("/content/0/transferenciaId").asText())
                .isEqualTo(transferenciaId);
    }

    @Test
    @DisplayName("transferência: saldo insuficiente, mesma filial, sem estoque na origem e destino sem controle são recusados")
    void transferenciaRecusada() throws Exception {
        UUID origem = idDe(abrir(loja, parafuso, null, true, null, "3"));

        transferir(parafuso, loja, centro, "3.5", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Saldo insuficiente na filial Loja Matriz: há 3 UN"));
        transferir(parafuso, loja, loja, "1", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A filial de origem e a de destino são a mesma"));
        transferir(parafuso, centro, loja, "1", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O produto Parafuso não tem estoque na filial Loja Centro"));

        UUID porca = criarProduto(token, "Porca");
        abrir(loja, porca, null, true, null, "5").andExpect(status().isCreated());
        abrir(centro, porca, null, false, null, null).andExpect(status().isCreated());
        transferir(porca, loja, centro, "1", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O produto Porca não controla estoque na filial Loja Centro"));

        // Nada se moveu, e a linha de destino da recusa por saldo não ficou
        saldo(origem).andExpect(jsonPath("$.quantidade").value(3));
        mockMvc.perform(get("/estoques").header(AUTHORIZATION, token).param("produtoId", parafuso.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Concorrência
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("entradas simultâneas não se perdem: a linha é travada e o histórico fecha a conta")
    void entradasSimultaneas() throws Exception {
        UUID id = idDe(abrir(loja, parafuso, null, true, null, null));
        int vezes = 12;

        ExecutorService pool = Executors.newFixedThreadPool(6);
        try {
            List<Callable<Integer>> tarefas = new ArrayList<>();
            for (int i = 0; i < vezes; i++) {
                tarefas.add(() -> entrada(id, "1", null).andReturn().getResponse().getStatus());
            }
            for (Future<Integer> resultado : pool.invokeAll(tarefas)) {
                assertThat(resultado.get()).isEqualTo(201);
            }
        } finally {
            pool.shutdown();
        }

        saldo(id).andExpect(jsonPath("$.quantidade").value(vezes));
        // Cada movimento parte de onde o anterior parou: nenhum leu saldo velho
        List<BigDecimal> anteriores = estoqueMovimentacaoRepository.findAll().stream()
                .map(m -> m.getQuantidadeAnterior().stripTrailingZeros())
                .sorted()
                .toList();
        assertThat(anteriores).hasSize(vezes);
        for (int i = 0; i < vezes; i++) {
            assertThat(anteriores.get(i).compareTo(BigDecimal.valueOf(i))).isZero();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("estoque de outro tenant é 404 em tudo, e não aparece em lista, combo nem histórico")
    void isolamento() throws Exception {
        UUID idNoA = idDe(abrir(loja, parafuso, "9.90", true, null, "10"));
        String tokenB = autenticar(adminB.getEmail());
        UUID filialDoB = criarMatriz(tokenB, salvarPessoa(tenantB, "Loja do B").getId());

        mockMvc.perform(get("/estoques/{id}", idNoA).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/estoques/{id}", idNoA).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content("{\"precoVenda\":0,\"controlaEstoque\":true}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/estoques/{id}/entradas", idNoA).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content("{\"quantidade\":1}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/estoques/{id}/ajustes", idNoA).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content("{\"quantidadeNova\":0,\"motivo\":\"Zerar\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/estoques").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/estoques/movimentacoes").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/estoques/movimentaveis").header(AUTHORIZATION, tokenB).param("filialId", loja.toString()))
                .andExpect(jsonPath("$", hasSize(0)));

        // Abrir estoque do produto do A na filial do B, ou transferir para lá: 404
        mockMvc.perform(post("/estoques").header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content(corpoAbrir(filialDoB, parafuso, null, true, null, null)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/estoques/transferencias").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content(corpoTransferir(parafuso, loja, filialDoB, "1", null)))
                .andExpect(status().isNotFound());
        transferir(parafuso, loja, filialDoB, "1", null).andExpect(status().isNotFound());

        saldo(idNoA)
                .andExpect(jsonPath("$.quantidade").value(10))
                .andExpect(jsonPath("$.precoVenda").value(9.9));
    }

    // ─────────────────────────────────────────────────────────────────

    private UUID criarMatriz(String tokenDo, UUID pessoaId) throws Exception {
        return idDe(mockMvc.perform(post("/filiais").header(AUTHORIZATION, tokenDo)
                        .contentType("application/json")
                        .content("""
                                {"pessoaId":"%s","tipo":"MATRIZ","cor":"#3B82F6"}
                                """.formatted(pessoaId)))
                .andExpect(status().isCreated()));
    }

    private UUID criarProduto(String tokenDo, String nome) throws Exception {
        return idDe(mockMvc.perform(post("/produtos").header(AUTHORIZATION, tokenDo)
                        .contentType("application/json")
                        .content("""
                                {"nome":"%s","unidadeMedidaId":"%s"}
                                """.formatted(nome, unidade("UN"))))
                .andExpect(status().isCreated()));
    }

    private ResultActions abrir(UUID filialId, UUID produtoId, String preco, boolean controla,
                                String minimo, String inicial) throws Exception {
        return mockMvc.perform(post("/estoques").header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(corpoAbrir(filialId, produtoId, preco, controla, minimo, inicial)));
    }

    private String corpoAbrir(UUID filialId, UUID produtoId, String preco, boolean controla,
                              String minimo, String inicial) throws Exception {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("produtoId", produtoId);
        campos.put("filialId", filialId);
        campos.put("precoVenda", preco != null ? new BigDecimal(preco) : null);
        campos.put("controlaEstoque", controla);
        campos.put("quantidadeMinima", minimo != null ? new BigDecimal(minimo) : null);
        campos.put("quantidadeInicial", inicial != null ? new BigDecimal(inicial) : null);
        return objectMapper.writeValueAsString(campos);
    }

    private ResultActions alterar(UUID id, String preco, boolean controla, String minimo) throws Exception {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("precoVenda", preco != null ? new BigDecimal(preco) : null);
        campos.put("controlaEstoque", controla);
        campos.put("quantidadeMinima", minimo != null ? new BigDecimal(minimo) : null);
        return mockMvc.perform(put("/estoques/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json").content(objectMapper.writeValueAsString(campos)));
    }

    private ResultActions entrada(UUID id, String quantidade, String motivo) throws Exception {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("quantidade", new BigDecimal(quantidade));
        campos.put("motivo", motivo);
        return mockMvc.perform(post("/estoques/{id}/entradas", id).header(AUTHORIZATION, token)
                .contentType("application/json").content(objectMapper.writeValueAsString(campos)));
    }

    private ResultActions ajuste(UUID id, String quantidadeNova, String motivo) throws Exception {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("quantidadeNova", new BigDecimal(quantidadeNova));
        campos.put("motivo", motivo);
        return mockMvc.perform(post("/estoques/{id}/ajustes", id).header(AUTHORIZATION, token)
                .contentType("application/json").content(objectMapper.writeValueAsString(campos)));
    }

    private ResultActions transferir(UUID produtoId, UUID origem, UUID destino, String quantidade,
                                     String motivo) throws Exception {
        return mockMvc.perform(post("/estoques/transferencias").header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(corpoTransferir(produtoId, origem, destino, quantidade, motivo)));
    }

    private String corpoTransferir(UUID produtoId, UUID origem, UUID destino, String quantidade,
                                   String motivo) throws Exception {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("produtoId", produtoId);
        campos.put("filialOrigemId", origem);
        campos.put("filialDestinoId", destino);
        campos.put("quantidade", new BigDecimal(quantidade));
        campos.put("motivo", motivo);
        return objectMapper.writeValueAsString(campos);
    }

    private ResultActions saldo(UUID id) throws Exception {
        return mockMvc.perform(get("/estoques/{id}", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk());
    }

    private ResultActions movimentos(UUID estoqueId) throws Exception {
        return mockMvc.perform(get("/estoques/movimentacoes").header(AUTHORIZATION, token)
                        .param("estoqueId", estoqueId.toString()))
                .andExpect(status().isOk());
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        String corpo = resultado.andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }
}
