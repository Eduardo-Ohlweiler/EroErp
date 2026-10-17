package com.api.ero_erp.auxiliarproduto;

import com.api.ero_erp.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Auxiliares do produto — grupo, subgrupo, categoria e marca. Por tenant,
 * nome único sem olhar maiúscula nem acento, sem delete.
 */
@DisplayName("Auxiliares de produto")
class AuxiliarProdutoTest extends AbstractIntegrationTest {

    private String token;

    @BeforeEach
    void entrar() throws Exception {
        token = autenticar(adminA.getEmail());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Grupo, categoria e marca — o mesmo molde
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("nome repetido é 409 com a frase do auxiliar; em outro tenant, passa")
    void nomeUnicoNoTenant() throws Exception {
        criar("/grupos-produto", "Bebidas").andExpect(status().isCreated());
        criar("/grupos-produto", "BEBÍDAS")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe um grupo com o nome \"BEBÍDAS\""));

        criar("/categorias-produto", "Limpeza").andExpect(status().isCreated());
        criar("/categorias-produto", "limpeza")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe uma categoria com o nome \"limpeza\""));

        criar("/marcas-produto", "Acme").andExpect(status().isCreated());
        criar("/marcas-produto", "ACME").andExpect(status().isConflict());

        mockMvc.perform(post("/grupos-produto").header(AUTHORIZATION, autenticar(adminB.getEmail()))
                        .contentType("application/json").content("{\"nome\":\"Bebidas\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("nome em branco ou com mais de 100 caracteres é 400")
    void nomeInvalido() throws Exception {
        criar("/marcas-produto", " ").andExpect(status().isBadRequest());
        criar("/marcas-produto", "x".repeat(101)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("alterar mantendo o próprio nome passa; tomando o de outro, 409")
    void alterarNome() throws Exception {
        UUID id = idDe(criar("/marcas-produto", "Acme"));
        criar("/marcas-produto", "Globex").andExpect(status().isCreated());

        mockMvc.perform(put("/marcas-produto/{id}", id).header(AUTHORIZATION, token)
                        .contentType("application/json").content("{\"nome\":\"ACME\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("ACME"));
        mockMvc.perform(put("/marcas-produto/{id}", id).header(AUTHORIZATION, token)
                        .contentType("application/json").content("{\"nome\":\"globex\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("inativar tira do combo e a lista filtra por situação e por nome sem acento")
    void inativarEFiltrar() throws Exception {
        UUID limpeza = idDe(criar("/categorias-produto", "Limpeza"));
        criar("/categorias-produto", "Higiene pessoal").andExpect(status().isCreated());
        criar("/categorias-produto", "Açougue").andExpect(status().isCreated());

        alterarAtivo("/categorias-produto", limpeza, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        mockMvc.perform(get("/categorias-produto/select").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nome").value("Açougue"));
        mockMvc.perform(get("/categorias-produto").header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].nome").value("Limpeza"));
        mockMvc.perform(get("/categorias-produto").header(AUTHORIZATION, token).param("termo", "acou"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Subgrupo
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("subgrupo: único dentro do grupo, o mesmo nome passa em outro grupo")
    void subgrupoUnicoNoGrupo() throws Exception {
        UUID bebidas = idDe(criar("/grupos-produto", "Bebidas"));
        UUID limpeza = idDe(criar("/grupos-produto", "Limpeza"));

        criarSubgrupo(bebidas, "Diversos")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.grupoNome").value("Bebidas"));
        criarSubgrupo(bebidas, "diversos")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        "Já existe um subgrupo com o nome \"diversos\" no grupo \"Bebidas\""));
        criarSubgrupo(limpeza, "Diversos").andExpect(status().isCreated());
    }

    @Test
    @DisplayName("subgrupo muda de grupo; grupo inativo não recebe subgrupo novo e some do combo")
    void subgrupoEGrupoInativo() throws Exception {
        UUID bebidas = idDe(criar("/grupos-produto", "Bebidas"));
        UUID limpeza = idDe(criar("/grupos-produto", "Limpeza"));
        UUID sucos = idDe(criarSubgrupo(bebidas, "Sucos"));
        criarSubgrupo(limpeza, "Detergentes").andExpect(status().isCreated());

        mockMvc.perform(put("/subgrupos-produto/{id}", sucos).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("{\"grupoId\":\"%s\",\"nome\":\"Sucos\"}".formatted(limpeza)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grupoNome").value("Limpeza"));

        alterarAtivo("/grupos-produto", limpeza, false).andExpect(status().isOk());
        criarSubgrupo(limpeza, "Ceras")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O grupo \"Limpeza\" está inativo. Reative antes de usar"));

        // O subgrupo de grupo inativo sai do combo, mas a lista o mostra, sinalizado
        mockMvc.perform(get("/subgrupos-produto/select").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/subgrupos-produto").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].grupoAtivo").value(false));

        // E o filtro por grupo
        mockMvc.perform(get("/subgrupos-produto").header(AUTHORIZATION, token).param("grupoId", limpeza.toString()))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("auxiliar de outro tenant é 404 e não aparece em lista nem combo")
    void isolamento() throws Exception {
        UUID marca = idDe(criar("/marcas-produto", "Acme"));
        UUID grupo = idDe(criar("/grupos-produto", "Bebidas"));
        UUID subgrupo = idDe(criarSubgrupo(grupo, "Sucos"));
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/marcas-produto/{id}", marca).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/marcas-produto/{id}", marca).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content("{\"nome\":\"Tomada\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/subgrupos-produto/{id}/ativo", subgrupo).header(AUTHORIZATION, tokenB)
                        .param("ativo", "false"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/marcas-produto/select").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/subgrupos-produto").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));

        // Subgrupo no grupo de outro tenant: 404, nada gravado
        mockMvc.perform(post("/subgrupos-produto").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content("{\"grupoId\":\"%s\",\"nome\":\"Invasor\"}".formatted(grupo)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/subgrupos-produto").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ─────────────────────────────────────────────────────────────────

    private ResultActions criar(String rota, String nome) throws Exception {
        return mockMvc.perform(post(rota).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("{\"nome\":%s}".formatted(objectMapper.writeValueAsString(nome))));
    }

    private ResultActions criarSubgrupo(UUID grupoId, String nome) throws Exception {
        return mockMvc.perform(post("/subgrupos-produto").header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("{\"grupoId\":\"%s\",\"nome\":\"%s\"}".formatted(grupoId, nome)));
    }

    private ResultActions alterarAtivo(String rota, UUID id, boolean ativo) throws Exception {
        return mockMvc.perform(patch(rota + "/{id}/ativo", id).header(AUTHORIZATION, token)
                .param("ativo", String.valueOf(ativo)));
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        String corpo = resultado.andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }
}
