package com.api.ero_erp.produto;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.catalogo.repository.TipoCadastroRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tenant.entity.Tenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;

import java.util.LinkedHashMap;
import java.util.Map;
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
 * Cadastro de produtos — sem parte fiscal. Código curto por tenant, nome
 * único, EAN único e conferido pelo dígito verificador, custo opcional em que
 * vazio não é zero.
 */
@DisplayName("Cadastro de produtos")
class ProdutoTest extends AbstractIntegrationTest {

    /** EANs com o verificador certo (calculado à parte). */
    private static final String EAN_13 = "7891000315507";
    private static final String OUTRO_EAN_13 = "7891234567895";
    private static final String EAN_8 = "95011011";

    @Autowired private TipoCadastroRepository tipoCadastroRepository;

    private String token;
    private UUID un;

    @BeforeEach
    void entrar() throws Exception {
        token = autenticar(adminA.getEmail());
        un = unidade("UN");
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cria com tudo; a resposta traz unidade, grupo, subgrupo, categoria, marca e fornecedor pelo nome")
    void criaCompleto() throws Exception {
        UUID grupo = criarAuxiliar("/grupos-produto", "{\"nome\":\"Bebidas\"}");
        UUID subgrupo = criarAuxiliar("/subgrupos-produto", "{\"grupoId\":\"%s\",\"nome\":\"Sucos\"}".formatted(grupo));
        UUID categoria = criarAuxiliar("/categorias-produto", "{\"nome\":\"Mercearia\"}");
        UUID marca = criarAuxiliar("/marcas-produto", "{\"nome\":\"Acme\"}");
        UUID fornecedor = salvarFornecedor(tenantA, "Distribuidora Sul").getId();

        Map<String, Object> campos = base("Suco de uva 1L");
        campos.put("descricao", "Integral");
        campos.put("ean", EAN_13);
        campos.put("unidadeMedidaId", unidade("LT"));
        campos.put("subgrupoId", subgrupo);
        campos.put("categoriaId", categoria);
        campos.put("marcaId", marca);
        campos.put("fornecedorId", fornecedor);
        campos.put("custo", 7.5);

        criar(campos)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value(1))
                .andExpect(jsonPath("$.unidadeSigla").value("LT"))
                .andExpect(jsonPath("$.grupoNome").value("Bebidas"))
                .andExpect(jsonPath("$.subgrupoNome").value("Sucos"))
                .andExpect(jsonPath("$.categoriaNome").value("Mercearia"))
                .andExpect(jsonPath("$.marcaNome").value("Acme"))
                .andExpect(jsonPath("$.fornecedorNome").value("Distribuidora Sul"))
                .andExpect(jsonPath("$.ean").value(EAN_13))
                .andExpect(jsonPath("$.custo").value(7.5));
    }

    @Test
    @DisplayName("custo vazio fica vazio, zero fica zero; descrição em branco some")
    void vazioNaoEZero() throws Exception {
        Map<String, Object> semCusto = base("Sacola");
        semCusto.put("descricao", "  ");
        criar(semCusto)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.custo").doesNotExist())
                .andExpect(jsonPath("$.descricao").doesNotExist());

        Map<String, Object> custoZero = base("Brinde");
        custoZero.put("custo", 0);
        criar(custoZero).andExpect(jsonPath("$.custo").value(0));
    }

    @Test
    @DisplayName("custo negativo ou com três casas, e unidade ausente, são 400")
    void camposInvalidos() throws Exception {
        Map<String, Object> negativo = base("A");
        negativo.put("custo", -1);
        criar(negativo).andExpect(status().isBadRequest());

        Map<String, Object> tresCasas = base("A");
        tresCasas.put("custo", 1.234);
        criar(tresCasas).andExpect(status().isBadRequest());

        Map<String, Object> semUnidade = base("A");
        semUnidade.remove("unidadeMedidaId");
        criar(semUnidade).andExpect(status().isBadRequest());

        assertThat(produtoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("o código segue 1, 2, 3 no tenant e recomeça no outro; falha não gasta número")
    void codigoPorTenant() throws Exception {
        criar(base("A")).andExpect(jsonPath("$.codigo").value(1));
        // Recusado depois de conferido o nome: o código não sai
        Map<String, Object> eanRuim = base("B");
        eanRuim.put("ean", "7891000315508");
        criar(eanRuim).andExpect(status().isBadRequest());
        criar(base("B")).andExpect(jsonPath("$.codigo").value(2));

        criarCom(autenticar(adminB.getEmail()), base("A")).andExpect(jsonPath("$.codigo").value(1));
    }

    @Test
    @DisplayName("nome repetido no tenant é 409, sem olhar maiúscula nem acento")
    void nomeUnico() throws Exception {
        criar(base("Pão de queijo")).andExpect(status().isCreated());
        criar(base("PAO DE QUEIJO"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Já existe um produto com o nome \"PAO DE QUEIJO\""));
        criarCom(autenticar(adminB.getEmail()), base("Pão de queijo")).andExpect(status().isCreated());
    }

    // ─────────────────────────────────────────────────────────────────
    //  EAN
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("EAN: verificador errado, letra e tamanho errado são 400, cada um com a sua frase")
    void eanInvalido() throws Exception {
        criar(comEan("A", "7891000315508"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(
                        "O EAN 7891000315508 não confere: o dígito verificador seria 7. Confira a digitação"));
        criar(comEan("A", "78910003155X7"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("O EAN aceita só dígitos"));
        criar(comEan("A", "123456789"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("O EAN tem 8, 12, 13 ou 14 dígitos; este tem 9"));

        criar(comEan("A", EAN_8)).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("EAN repetido no tenant é 409 e diz de qual produto é; em outro tenant, passa; vazio não conta")
    void eanUnico() throws Exception {
        criar(comEan("Suco", EAN_13)).andExpect(status().isCreated());
        criar(comEan("Outro suco", EAN_13))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("O EAN " + EAN_13 + " já é do produto 1"));

        criar(comEan("Sem EAN 1", "")).andExpect(status().isCreated());
        criar(comEan("Sem EAN 2", null)).andExpect(status().isCreated());

        criarCom(autenticar(adminB.getEmail()), comEan("Suco", EAN_13)).andExpect(status().isCreated());
    }

    // ─────────────────────────────────────────────────────────────────
    //  O que o produto aponta
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("marca inativa não entra; a que já estava fica, e o produto ainda se altera")
    void auxiliarInativo() throws Exception {
        UUID marca = criarAuxiliar("/marcas-produto", "{\"nome\":\"Acme\"}");
        Map<String, Object> campos = base("Parafuso");
        campos.put("marcaId", marca);
        UUID id = idDe(criar(campos));

        mockMvc.perform(patch("/marcas-produto/{id}/ativo", marca).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());

        campos.put("nome", "Parafuso 10mm");
        alterar(id, campos)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.marcaNome").value("Acme"));

        Map<String, Object> outro = base("Porca");
        outro.put("marcaId", marca);
        criar(outro)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("A marca \"Acme\" está inativa. Reative antes de usar"));
    }

    @Test
    @DisplayName("fornecedor tem de ter o tipo Fornecedor; tirar o fornecedor grava nulo")
    void fornecedor() throws Exception {
        UUID cliente = salvarPessoa(tenantA, "Só cliente").getId();
        Map<String, Object> campos = base("Parafuso");
        campos.put("fornecedorId", cliente);
        criar(campos)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Só cliente não tem o tipo de cadastro Fornecedor"));

        campos.put("fornecedorId", salvarFornecedor(tenantA, "Ferragens Ltda").getId());
        UUID id = idDe(criar(campos).andExpect(status().isCreated()));

        campos.remove("fornecedorId");
        alterar(id, campos)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fornecedorId").doesNotExist());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Consulta e estado
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a lista filtra por nome sem acento, código, EAN, grupo, marca e situação")
    void filtros() throws Exception {
        UUID grupo = criarAuxiliar("/grupos-produto", "{\"nome\":\"Bebidas\"}");
        UUID subgrupo = criarAuxiliar("/subgrupos-produto", "{\"grupoId\":\"%s\",\"nome\":\"Sucos\"}".formatted(grupo));
        UUID marca = criarAuxiliar("/marcas-produto", "{\"nome\":\"Acme\"}");

        Map<String, Object> suco = comEan("Suco de maçã", EAN_13);
        suco.put("subgrupoId", subgrupo);
        criar(suco).andExpect(status().isCreated());
        Map<String, Object> parafuso = base("Parafuso");
        parafuso.put("marcaId", marca);
        UUID idParafuso = idDe(criar(parafuso));
        criar(base("Água")).andExpect(status().isCreated());
        mockMvc.perform(patch("/produtos/{id}/ativo", idParafuso).header(AUTHORIZATION, token).param("ativo", "false"))
                .andExpect(status().isOk());

        listar("termo", "maca").andExpect(jsonPath("$.totalElements").value(1));
        listar("termo", "3").andExpect(jsonPath("$.content[0].nome").value("Água"));
        listar("termo", EAN_13).andExpect(jsonPath("$.content[0].nome").value("Suco de maçã"));
        listar("grupoId", grupo.toString()).andExpect(jsonPath("$.totalElements").value(1));
        listar("marcaId", marca.toString()).andExpect(jsonPath("$.content[0].nome").value("Parafuso"));
        listar("ativo", "true").andExpect(jsonPath("$.totalElements").value(2));

        // O combo: só ativos, e sem custo
        mockMvc.perform(get("/produtos/select").header(AUTHORIZATION, token))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].unidadeSigla").value("UN"))
                .andExpect(jsonPath("$[0].custo").doesNotExist());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("produto de outro tenant é 404 e não aparece; marca e fornecedor de outro tenant também são 404")
    void isolamento() throws Exception {
        UUID marcaDoA = criarAuxiliar("/marcas-produto", "{\"nome\":\"Acme\"}");
        UUID fornecedorDoA = salvarFornecedor(tenantA, "Distribuidora").getId();
        UUID idNoA = idDe(criar(base("Parafuso")));
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/produtos/{id}", idNoA).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/produtos/{id}", idNoA).header(AUTHORIZATION, tokenB)
                        .contentType("application/json").content(objectMapper.writeValueAsString(base("Tomado"))))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/produtos/{id}/ativo", idNoA).header(AUTHORIZATION, tokenB).param("ativo", "false"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/produtos").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/produtos/select").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$", hasSize(0)));

        Map<String, Object> comMarcaAlheia = base("Com marca alheia");
        comMarcaAlheia.put("marcaId", marcaDoA);
        criarCom(tokenB, comMarcaAlheia).andExpect(status().isNotFound());
        Map<String, Object> comFornecedorAlheio = base("Com fornecedor alheio");
        comFornecedorAlheio.put("fornecedorId", fornecedorDoA);
        criarCom(tokenB, comFornecedorAlheio).andExpect(status().isNotFound());

        mockMvc.perform(get("/produtos").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // ─────────────────────────────────────────────────────────────────

    private Map<String, Object> base(String nome) {
        Map<String, Object> campos = new LinkedHashMap<>();
        campos.put("nome", nome);
        campos.put("unidadeMedidaId", un);
        return campos;
    }

    private Map<String, Object> comEan(String nome, String ean) {
        Map<String, Object> campos = base(nome);
        campos.put("ean", ean);
        return campos;
    }

    private ResultActions criar(Map<String, Object> campos) throws Exception {
        return criarCom(token, campos);
    }

    private ResultActions criarCom(String tokenDo, Map<String, Object> campos) throws Exception {
        return mockMvc.perform(post("/produtos").header(AUTHORIZATION, tokenDo)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(campos)));
    }

    private ResultActions alterar(UUID id, Map<String, Object> campos) throws Exception {
        return mockMvc.perform(put("/produtos/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(campos)));
    }

    private ResultActions listar(String parametro, String valor) throws Exception {
        return mockMvc.perform(get("/produtos").header(AUTHORIZATION, token).param(parametro, valor))
                .andExpect(status().isOk());
    }

    private UUID criarAuxiliar(String rota, String corpo) throws Exception {
        return idDe(mockMvc.perform(post(rota).header(AUTHORIZATION, token)
                        .contentType("application/json").content(corpo))
                .andExpect(status().isCreated()));
    }

    private Pessoa salvarFornecedor(Tenant tenant, String nome) {
        Pessoa pessoa = salvarPessoa(tenant, nome);
        tipoCadastroRepository.findAllByAtivoTrueOrderByNome().stream()
                .filter(t -> t.getNome().equals("Fornecedor"))
                .findFirst()
                .ifPresent(pessoa.getTiposCadastro()::add);
        return pessoaRepository.save(pessoa);
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        String corpo = resultado.andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }
}
