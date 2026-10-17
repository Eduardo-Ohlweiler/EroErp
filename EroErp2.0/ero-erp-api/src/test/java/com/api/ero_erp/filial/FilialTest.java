package com.api.ero_erp.filial;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.pessoa.entity.Pessoa;
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
 * Cadastro de filiais — o "emitente" do EroErp antigo, com as regras que
 * faltavam lá: a matriz é uma filial MATRIZ ativa do mesmo tenant, nada se
 * apaga, e matriz com filial ativa não inativa. Várias matrizes por tenant são
 * permitidas de propósito (negócios separados).
 */
@DisplayName("Cadastro de filiais")
class FilialTest extends AbstractIntegrationTest {

    private String token;
    private Pessoa loja;
    private Pessoa lojaCentro;
    private Pessoa consultorio;

    @BeforeEach
    void prepararPessoas() throws Exception {
        token = autenticar(adminA.getEmail());
        loja = salvarPessoa(tenantA, "Loja Matriz");
        lojaCentro = salvarPessoa(tenantA, "Loja Centro");
        consultorio = salvarPessoa(tenantA, "Consultório");
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cria matriz e filial; a filial mostra a matriz")
    void criaMatrizEFilial() throws Exception {
        UUID matriz = criarMatriz(loja);

        criar(lojaCentro.getId(), "FILIAL", matriz, "#10b981")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("FILIAL"))
                .andExpect(jsonPath("$.matrizId").value(matriz.toString()))
                .andExpect(jsonPath("$.matrizNome").value("Loja Matriz"))
                .andExpect(jsonPath("$.pessoaNome").value("Loja Centro"))
                // A cor é gravada em maiúsculas, venha como vier
                .andExpect(jsonPath("$.cor").value("#10B981"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @DisplayName("o mesmo tenant pode ter duas matrizes — negócios separados")
    void duasMatrizesNoMesmoTenant() throws Exception {
        criarMatriz(loja);
        criarMatriz(consultorio);

        mockMvc.perform(get("/filiais").header(AUTHORIZATION, token).param("tipo", "MATRIZ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("filial sem matriz é recusada")
    void filialSemMatrizFalha() throws Exception {
        criar(lojaCentro.getId(), "FILIAL", null, "#3B82F6")
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("matriz com matriz é recusada")
    void matrizComMatrizFalha() throws Exception {
        UUID matriz = criarMatriz(loja);

        criar(consultorio.getId(), "MATRIZ", matriz, "#3B82F6")
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a matriz escolhida tem de ser uma MATRIZ")
    void matrizQueEFilialFalha() throws Exception {
        UUID matriz = criarMatriz(loja);
        UUID filial = criarFilial(lojaCentro, matriz);

        criar(consultorio.getId(), "FILIAL", filial, "#3B82F6")
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("a matriz escolhida tem de estar ativa")
    void matrizInativaFalha() throws Exception {
        UUID matriz = criarMatriz(loja);
        alterarAtivo(matriz, false).andExpect(status().isOk());

        criar(lojaCentro.getId(), "FILIAL", matriz, "#3B82F6")
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("a mesma pessoa não vira duas filiais")
    void pessoaRepetidaFalha() throws Exception {
        criarMatriz(loja);

        criar(loja.getId(), "MATRIZ", null, "#3B82F6")
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("pessoa inativa não vira filial")
    void pessoaInativaFalha() throws Exception {
        loja.setAtivo(false);
        pessoaRepository.save(loja);

        criar(loja.getId(), "MATRIZ", null, "#3B82F6")
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("cor fora de #RRGGBB é recusada, no cadastro e na alteração")
    void corInvalidaFalha() throws Exception {
        criar(loja.getId(), "MATRIZ", null, "azul")
                .andExpect(status().isBadRequest());

        UUID matriz = criarMatriz(loja);
        alterar(matriz, loja.getId(), "MATRIZ", null, "")
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Estado
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("matriz com filial ativa não inativa; sem ela, inativa")
    void inativarMatrizComFilialAtivaFalha() throws Exception {
        UUID matriz = criarMatriz(loja);
        UUID filial = criarFilial(lojaCentro, matriz);

        alterarAtivo(matriz, false)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Esta matriz tem 1 filial ativa. Inative-a antes"));

        alterarAtivo(filial, false).andExpect(status().isOk());
        alterarAtivo(matriz, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));
    }

    @Test
    @DisplayName("filial de matriz inativa não reativa antes da matriz")
    void reativarFilialDeMatrizInativaFalha() throws Exception {
        UUID matriz = criarMatriz(loja);
        UUID filial = criarFilial(lojaCentro, matriz);
        alterarAtivo(filial, false).andExpect(status().isOk());
        alterarAtivo(matriz, false).andExpect(status().isOk());

        alterarAtivo(filial, true).andExpect(status().isConflict());

        // Inativa, ela ainda aceita correção sem mudar de matriz
        alterar(filial, lojaCentro.getId(), "FILIAL", matriz, "#EF4444")
                .andExpect(status().isOk());

        alterarAtivo(matriz, true).andExpect(status().isOk());
        alterarAtivo(filial, true).andExpect(status().isOk());
    }

    @Test
    @DisplayName("matriz com filiais não vira filial")
    void matrizComFiliaisNaoViraFilial() throws Exception {
        UUID matriz = criarMatriz(loja);
        criarFilial(lojaCentro, matriz);
        UUID outraMatriz = criarMatriz(consultorio);

        alterar(matriz, loja.getId(), "FILIAL", outraMatriz, "#3B82F6")
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("filial não pode ser a própria matriz")
    void filialNaoEAPropriaMatriz() throws Exception {
        UUID matriz = criarMatriz(loja);

        alterar(matriz, loja.getId(), "FILIAL", matriz, "#3B82F6")
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Consulta
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a lista traz cada matriz seguida das suas filiais")
    void listaAgrupaPorMatriz() throws Exception {
        UUID consultorioId = criarMatriz(consultorio);
        UUID lojaId = criarMatriz(loja);
        criarFilial(lojaCentro, lojaId);

        mockMvc.perform(get("/filiais").header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(consultorioId.toString()))
                .andExpect(jsonPath("$.content[1].id").value(lojaId.toString()))
                .andExpect(jsonPath("$.content[2].pessoaNome").value("Loja Centro"));
    }

    @Test
    @DisplayName("o combo traz só as ativas, filtra por tipo e tira a própria")
    void selectSoAtivas() throws Exception {
        UUID lojaId = criarMatriz(loja);
        UUID consultorioId = criarMatriz(consultorio);
        criarFilial(lojaCentro, lojaId);
        alterarAtivo(consultorioId, false).andExpect(status().isOk());

        mockMvc.perform(get("/filiais/select").header(AUTHORIZATION, token)
                        .param("tipo", "MATRIZ").param("ignorarId", lojaId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/filiais/select").header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("filial de outro tenant devolve 404 e não aparece na lista")
    void filialDeOutroTenantNaoAparece() throws Exception {
        UUID idNoA = criarMatriz(loja);
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/filiais/{id}", idNoA).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/filiais").header(AUTHORIZATION, tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/filiais/select").header(AUTHORIZATION, tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(patch("/filiais/{id}/ativo", idNoA).header(AUTHORIZATION, tokenB)
                        .param("ativo", "false"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("pessoa e matriz de outro tenant devolvem 404")
    void pessoaEMatrizDeOutroTenantFalham() throws Exception {
        UUID matrizNoA = criarMatriz(loja);
        Pessoa doB = salvarPessoa(tenantB, "Empresa do B");
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(post("/filiais").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content(json(lojaCentro.getId(), "MATRIZ", null, "#3B82F6")))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/filiais").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content(json(doB.getId(), "FILIAL", matrizNoA, "#3B82F6")))
                .andExpect(status().isNotFound());

        assertThat(filialRepository.findAll()).singleElement()
                .satisfies(f -> assertThat(f.getId()).isEqualTo(matrizNoA));
    }

    // ─────────────────────────────────────────────────────────────────

    private UUID criarMatriz(Pessoa pessoa) throws Exception {
        return idDe(criar(pessoa.getId(), "MATRIZ", null, "#3B82F6").andExpect(status().isCreated()));
    }

    private UUID criarFilial(Pessoa pessoa, UUID matriz) throws Exception {
        return idDe(criar(pessoa.getId(), "FILIAL", matriz, "#3B82F6").andExpect(status().isCreated()));
    }

    private ResultActions criar(UUID pessoaId, String tipo, UUID matrizId, String cor) throws Exception {
        return mockMvc.perform(post("/filiais").header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(json(pessoaId, tipo, matrizId, cor)));
    }

    private ResultActions alterar(UUID id, UUID pessoaId, String tipo, UUID matrizId, String cor) throws Exception {
        return mockMvc.perform(put("/filiais/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(json(pessoaId, tipo, matrizId, cor)));
    }

    private ResultActions alterarAtivo(UUID id, boolean ativo) throws Exception {
        return mockMvc.perform(patch("/filiais/{id}/ativo", id).header(AUTHORIZATION, token)
                .param("ativo", String.valueOf(ativo)));
    }

    private static String json(UUID pessoaId, String tipo, UUID matrizId, String cor) {
        return """
                {"pessoaId":"%s","tipo":"%s","matrizId":%s,"cor":"%s"}
                """.formatted(pessoaId, tipo, matrizId == null ? "null" : "\"" + matrizId + "\"", cor);
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        String corpo = resultado.andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }
}
