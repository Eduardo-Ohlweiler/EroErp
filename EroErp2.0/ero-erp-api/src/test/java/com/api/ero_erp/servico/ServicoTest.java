package com.api.ero_erp.servico;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

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
 * Cadastro de serviços — no antigo, uma linha de produto com classificação
 * SERVICO. Aqui: tabela própria, código curto gerado por tenant, nome único
 * no tenant e valor opcional por filial, em que vazio não é zero.
 */
@DisplayName("Cadastro de serviços")
class ServicoTest extends AbstractIntegrationTest {

    private String token;
    private UUID loja;
    private UUID centro;

    @BeforeEach
    void prepararFiliais() throws Exception {
        token = autenticar(adminA.getEmail());
        loja = criarMatriz(token, salvarPessoa(tenantA, "Loja Matriz").getId());
        centro = criarMatriz(token, salvarPessoa(tenantA, "Loja Centro").getId());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cria com valor por filial; a resposta traz a filial pelo nome, em ordem")
    void criaComValoresPorFilial() throws Exception {
        criar("Instalação", "Inclui deslocamento", linha(loja, "150.00") + "," + linha(centro, "120.50"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value(1))
                .andExpect(jsonPath("$.nome").value("Instalação"))
                .andExpect(jsonPath("$.observacao").value("Inclui deslocamento"))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.filiais", hasSize(2)))
                .andExpect(jsonPath("$.filiais[0].filialNome").value("Loja Centro"))
                .andExpect(jsonPath("$.filiais[0].valor").value(120.50))
                .andExpect(jsonPath("$.filiais[1].filialNome").value("Loja Matriz"))
                .andExpect(jsonPath("$.filiais[1].valor").value(150.00));
    }

    @Test
    @DisplayName("valor vazio fica vazio, zero fica zero, observação em branco some")
    void vazioNaoEZero() throws Exception {
        criar("Orçamento", "   ", linhaSemValor(loja) + "," + linha(centro, "0"))
                .andExpect(status().isCreated())
                // A API omite o que é nulo: ausente é o "não informado"
                .andExpect(jsonPath("$.observacao").doesNotExist())
                .andExpect(jsonPath("$.filiais", hasSize(2)))
                .andExpect(jsonPath("$.filiais[0].filialNome").value("Loja Centro"))
                .andExpect(jsonPath("$.filiais[0].valor").value(0))
                .andExpect(jsonPath("$.filiais[1].valor").doesNotExist());
    }

    @Test
    @DisplayName("serviço sem filial nenhuma é válido")
    void semFiliais() throws Exception {
        criar("Consultoria", null, "")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filiais", hasSize(0)));
    }

    @Test
    @DisplayName("o código segue 1, 2, 3 dentro do tenant e recomeça no outro")
    void codigoSequencialPorTenant() throws Exception {
        criar("A", null, "").andExpect(jsonPath("$.codigo").value(1));
        criar("B", null, "").andExpect(jsonPath("$.codigo").value(2));

        String tokenB = autenticar(adminB.getEmail());
        criarCom(tokenB, "A", null, "").andExpect(jsonPath("$.codigo").value(1));

        criar("C", null, "").andExpect(jsonPath("$.codigo").value(3));
    }

    @Test
    @DisplayName("gravação que falha depois de pegar o código o devolve — sem buraco")
    void falhaNaoConsomeCodigo() throws Exception {
        criar("A", null, "").andExpect(jsonPath("$.codigo").value(1));

        // A filial de outro tenant só é recusada depois que o código já saiu
        String tokenB = autenticar(adminB.getEmail());
        UUID filialDoB = criarMatriz(tokenB, salvarPessoa(tenantB, "Loja do B").getId());
        criar("B", null, linha(filialDoB, "10")).andExpect(status().isNotFound());

        criar("B", null, "").andExpect(jsonPath("$.codigo").value(2));
    }

    @Test
    @DisplayName("nome repetido no tenant é 409, sem olhar maiúscula nem acento; em outro tenant, passa")
    void nomeUnicoNoTenant() throws Exception {
        criar("Instalação", null, "").andExpect(status().isCreated());

        criar("INSTALACAO", null, "")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe um serviço com o nome \"INSTALACAO\""));

        criarCom(autenticar(adminB.getEmail()), "Instalação", null, "")
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("a mesma filial duas vezes na lista é 400")
    void filialRepetidaFalha() throws Exception {
        criar("Instalação", null, linha(loja, "10") + "," + linha(loja, "20"))
                .andExpect(status().isBadRequest());
        assertThat(servicoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("valor negativo ou com três casas é 400")
    void valorInvalidoFalha() throws Exception {
        criar("Instalação", null, linha(loja, "-1")).andExpect(status().isBadRequest());
        criar("Instalação", null, linha(loja, "1.234")).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("nome em branco ou longo demais é 400")
    void nomeInvalidoFalha() throws Exception {
        criar(" ", null, "").andExpect(status().isBadRequest());
        criar("x".repeat(151), null, "").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("filial inativa não entra; a que já estava fica e o valor ainda se corrige")
    void filialInativa() throws Exception {
        UUID id = idDe(criar("Instalação", null, linha(loja, "100")));
        mockMvc.perform(patch("/filiais/{id}/ativo", loja).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());

        alterar(id, "Instalação", null, linha(loja, "110"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filiais[0].valor").value(110))
                .andExpect(jsonPath("$.filiais[0].filialAtiva").value(false));

        criar("Manutenção", null, linha(loja, "50")).andExpect(status().isConflict());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Alteração e estado
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("alterar troca nome e a lista inteira; o código não muda")
    void alteraListaCompleta() throws Exception {
        UUID id = idDe(criar("Instalação", null, linha(loja, "100") + "," + linha(centro, "90")));

        alterar(id, "Instalação completa", "Nova obs.", linhaSemValor(centro))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(1))
                .andExpect(jsonPath("$.nome").value("Instalação completa"))
                .andExpect(jsonPath("$.filiais", hasSize(1)))
                .andExpect(jsonPath("$.filiais[0].filialId").value(centro.toString()))
                .andExpect(jsonPath("$.filiais[0].valor").doesNotExist());

        // E o que voltou é o que ficou gravado
        mockMvc.perform(get("/servicos/{id}", id).header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.filiais", hasSize(1)))
                .andExpect(jsonPath("$.filiais[0].valor").doesNotExist());
    }

    @Test
    @DisplayName("alterar mantendo o próprio nome passa; tomando o de outro, 409")
    void alterarNome() throws Exception {
        UUID id = idDe(criar("Instalação", null, ""));
        criar("Manutenção", null, "").andExpect(status().isCreated());

        alterar(id, "instalação", null, "").andExpect(status().isOk());
        alterar(id, "Manutencao", null, "").andExpect(status().isConflict());
    }

    @Test
    @DisplayName("inativar e reativar; o combo só traz os ativos")
    void inativarEReativar() throws Exception {
        UUID id = idDe(criar("Instalação", null, ""));
        criar("Manutenção", null, "").andExpect(status().isCreated());

        alterarAtivo(id, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));
        mockMvc.perform(get("/servicos/select").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Manutenção"))
                // O combo não carrega valores
                .andExpect(jsonPath("$[0].filiais").doesNotExist());

        alterarAtivo(id, true).andExpect(jsonPath("$.ativo").value(true));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Consulta
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a lista filtra por nome sem acento, por código, por filial e por status")
    void filtros() throws Exception {
        criar("Instalação", null, linha(loja, "100")).andExpect(status().isCreated());
        UUID manutencao = idDe(criar("Manutenção", null, linhaSemValor(centro)));
        criar("Visita técnica", null, "").andExpect(status().isCreated());
        alterarAtivo(manutencao, false).andExpect(status().isOk());

        listar("termo", "instalacao")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].nome").value("Instalação"));
        listar("termo", "3")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].nome").value("Visita técnica"));
        listar("filialId", centro.toString())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].nome").value("Manutenção"));
        listar("ativo", "true")
                .andExpect(jsonPath("$.totalElements").value(2));

        // Sem filtro, em ordem de nome
        mockMvc.perform(get("/servicos").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].nome").value("Instalação"))
                .andExpect(jsonPath("$.content[0].filiais[0].valor").value(100))
                .andExpect(jsonPath("$.content[2].nome").value("Visita técnica"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("serviço de outro tenant devolve 404 e não aparece na lista nem no combo")
    void servicoDeOutroTenantNaoAparece() throws Exception {
        UUID idNoA = idDe(criar("Instalação", null, linha(loja, "100")));
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/servicos/{id}", idNoA).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/servicos").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/servicos/select").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(put("/servicos/{id}", idNoA).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content(json("Tomado", null, "")))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/servicos/{id}/ativo", idNoA).header(AUTHORIZATION, tokenB)
                        .param("ativo", "false"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/servicos/{id}", idNoA).header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.nome").value("Instalação"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @DisplayName("filial de outro tenant devolve 404 e nada é gravado")
    void filialDeOutroTenantFalha() throws Exception {
        String tokenB = autenticar(adminB.getEmail());

        criarCom(tokenB, "Instalação", null, linha(loja, "10"))
                .andExpect(status().isNotFound());
        assertThat(servicoRepository.findAll()).isEmpty();
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

    private ResultActions criar(String nome, String observacao, String linhas) throws Exception {
        return criarCom(token, nome, observacao, linhas);
    }

    private ResultActions criarCom(String tokenDo, String nome, String observacao, String linhas) throws Exception {
        return mockMvc.perform(post("/servicos").header(AUTHORIZATION, tokenDo)
                .contentType("application/json")
                .content(json(nome, observacao, linhas)));
    }

    private ResultActions alterar(UUID id, String nome, String observacao, String linhas) throws Exception {
        return mockMvc.perform(put("/servicos/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(json(nome, observacao, linhas)));
    }

    private ResultActions alterarAtivo(UUID id, boolean ativo) throws Exception {
        return mockMvc.perform(patch("/servicos/{id}/ativo", id).header(AUTHORIZATION, token)
                .param("ativo", String.valueOf(ativo)));
    }

    private ResultActions listar(String parametro, String valor) throws Exception {
        return mockMvc.perform(get("/servicos").header(AUTHORIZATION, token).param(parametro, valor))
                .andExpect(status().isOk());
    }

    private String json(String nome, String observacao, String linhas) throws Exception {
        return """
                {"nome":%s,"observacao":%s,"filiais":[%s]}
                """.formatted(objectMapper.writeValueAsString(nome),
                objectMapper.writeValueAsString(observacao), linhas);
    }

    private static String linha(UUID filialId, String valor) {
        return """
                {"filialId":"%s","valor":%s}""".formatted(filialId, valor);
    }

    private static String linhaSemValor(UUID filialId) {
        return """
                {"filialId":"%s","valor":null}""".formatted(filialId);
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        String corpo = resultado.andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }
}
