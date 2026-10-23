package com.api.ero_erp.consulta;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.util.List;
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
 * Consulta. No antigo ela copiava o horário do compromisso e tinha status
 * próprio, o preço vinha do cliente e o desconto não tinha guarda. Aqui a
 * situação é a do compromisso, o preço vem do catálogo da filial como
 * sugestão e fica gravado como retrato, e o servidor publica os totais.
 */
@DisplayName("Consulta")
class ConsultaTest extends AbstractIntegrationTest {

    private static final String INICIO = "2027-03-10T13:00:00Z";
    private static final String FIM = "2027-03-10T14:00:00Z";

    private String token;
    private UUID loja;
    private UUID cliente;
    private Usuario profissional;
    private UUID limpeza;      // R$ 150,00 na loja
    private UUID avaliacao;    // sem valor na loja
    private UUID luva;         // R$ 2,50, controla, saldo 10
    private UUID luvaEstoque;
    private UUID gel;          // R$ 30,00, sem controle de estoque

    @BeforeEach
    void preparar() throws Exception {
        token = autenticar(adminA.getEmail());
        loja = criarMatriz(token, salvarPessoa(tenantA, "Clínica Centro").getId());
        cliente = salvarPessoa(tenantA, "Maria Cliente").getId();
        profissional = criarUsuario(tenantA, "prof.a@teste.local", Role.USER);

        limpeza = criarServico("Limpeza", "150.00");
        avaliacao = criarServico("Avaliação", null);
        luva = criarProduto("Luva");
        luvaEstoque = abrirEstoque(luva, "2.50", true, "10");
        gel = criarProduto("Gel");
        abrirEstoque(gel, "30.00", false, null);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Nascer
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("converter compromisso: sem cliente é 400; com cliente nasce; de novo é 409")
    void converter() throws Exception {
        UUID semCliente = criarCompromisso(null, "2027-03-11T13:00:00Z", "2027-03-11T14:00:00Z");
        criar("""
                {"compromissoId":"%s"}""".formatted(semCliente))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A consulta precisa de um cliente"));

        UUID compromisso = criarCompromisso(cliente, INICIO, FIM);
        criar("""
                {"compromissoId":"%s","observacao":"Primeira vez"}""".formatted(compromisso))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.compromisso.id").value(compromisso.toString()))
                .andExpect(jsonPath("$.compromisso.consultaId").exists())
                .andExpect(jsonPath("$.compromisso.status").value("AGENDADO"))
                .andExpect(jsonPath("$.compromisso.pessoaNome").value("Maria Cliente"))
                .andExpect(jsonPath("$.observacao").value("Primeira vez"))
                .andExpect(jsonPath("$.servicos", hasSize(0)))
                .andExpect(jsonPath("$.total").value(0));

        criar("""
                {"compromissoId":"%s"}""".formatted(compromisso))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso já é uma consulta"));

        // A agenda passa a saber: o calendário e o detalhe trazem a consulta
        String consultaId = consultaRepository.findAll().getFirst().getId().toString();
        mockMvc.perform(get("/compromissos/{id}", compromisso).header(AUTHORIZATION, token))
                .andExpect(jsonPath("$.consultaId").value(consultaId));
        mockMvc.perform(get("/compromissos/calendario").header(AUTHORIZATION, token)
                        .param("inicio", "2027-03-01T03:00:00Z").param("fim", "2027-04-01T03:00:00Z"))
                .andExpect(jsonPath("$[?(@.id == '%s')].consultaId".formatted(compromisso)).value(consultaId))
                .andExpect(jsonPath("$[?(@.id == '%s')].consultaId".formatted(semCliente)).isEmpty());
    }

    @Test
    @DisplayName("nunca os dois jeitos de nascer, nem nenhum: 400")
    void umJeitoSoDeNascer() throws Exception {
        UUID compromisso = criarCompromisso(cliente, INICIO, FIM);
        criar("""
                {"compromissoId":"%s","compromisso":%s}""".formatted(compromisso, compromissoJson(INICIO, FIM)))
                .andExpect(status().isBadRequest());
        criar("{}").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("criar com o compromisso junto passa pelo conflito do responsável; sem cliente é 400")
    void criarComCompromissoJunto() throws Exception {
        criarCompromisso(cliente, INICIO, FIM);

        criar(nova(compromissoJson("2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z"), null, null, ""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        profissional.getNome() + " já tem compromisso neste horário: \"Consulta\", 10/03/2027 às 10:00"));
        assertThat(consultaRepository.findAll()).isEmpty();
        assertThat(compromissoRepository.findAll()).hasSize(1);

        criar(nova(compromissoJsonCom(null, "2027-03-12T13:00:00Z", "2027-03-12T14:00:00Z"), null, null, ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A consulta precisa de um cliente"));

        criar(nova(compromissoJson("2027-03-12T13:00:00Z", "2027-03-12T14:00:00Z"), null, null, ""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.compromisso.responsavelId").value(profissional.getId().toString()))
                .andExpect(jsonPath("$.compromisso.filialNome").value("Clínica Centro"));
        assertThat(compromissoRepository.findAll()).hasSize(2);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Preço
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("preço: vazio usa o catálogo da filial; informado vale; vazio sem catálogo é 400 nomeando")
    void precoDoCatalogo() throws Exception {
        criarNova(servico(limpeza, 1, null) + "," + servico(limpeza, 1, "120.00"), produto(luva, "2", null), "")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(150.0))
                .andExpect(jsonPath("$.servicos[0].descricao").value("Limpeza"))
                .andExpect(jsonPath("$.servicos[1].precoUnitario").value(120.0))
                .andExpect(jsonPath("$.produtos[0].precoUnitario").value(2.5))
                .andExpect(jsonPath("$.produtos[0].unidadeSigla").value("UN"));

        criar(nova(compromissoJson("2027-03-12T13:00:00Z", "2027-03-12T14:00:00Z"),
                servico(avaliacao, 1, null), null, ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Informe o preço de Avaliação: a filial não tem valor para ele"));

        // Informado, zero vale: vazio não é zero, mas zero é zero
        criar(nova(compromissoJson("2027-03-12T13:00:00Z", "2027-03-12T14:00:00Z"),
                servico(avaliacao, 1, "0"), null, ""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(0));
    }

    @Test
    @DisplayName("o retrato não muda quando o catálogo muda depois; o item mandado de volta sem preço mantém o dele")
    void retrato() throws Exception {
        JsonNode criada = corpo(criarNova(servico(limpeza, 1, null), null, "").andExpect(status().isCreated()));
        UUID id = UUID.fromString(criada.get("id").asText());
        String itemId = criada.get("servicos").get(0).get("id").asText();

        mockMvc.perform(put("/servicos/{id}", limpeza).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"nome":"Limpeza completa","filiais":[{"filialId":"%s","valor":200.00}]}
                                """.formatted(loja)))
                .andExpect(status().isOk());

        buscar(id)
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(150.0))
                .andExpect(jsonPath("$.servicos[0].descricao").value("Limpeza"));

        alterar(id, atualizacao(INICIO, FIM, """
                [{"id":"%s","servicoId":"%s","quantidade":2}]""".formatted(itemId, limpeza), null, ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos[0].id").value(itemId))
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(150.0))
                .andExpect(jsonPath("$.servicos[0].descricao").value("Limpeza"))
                .andExpect(jsonPath("$.servicos[0].total").value(300.0));

        // Item novo do mesmo serviço: nome e preço de hoje
        alterar(id, atualizacao(INICIO, FIM, """
                [{"id":"%s","servicoId":"%s","quantidade":2},{"servicoId":"%s","quantidade":1}]"""
                .formatted(itemId, limpeza, limpeza), null, ""))
                .andExpect(jsonPath("$.servicos[1].precoUnitario").value(200.0))
                .andExpect(jsonPath("$.servicos[1].descricao").value("Limpeza completa"));
    }

    @Test
    @DisplayName("produto sem estoque na filial é 409; o preço do produto vem do estoque")
    void produtoPrecisaDeEstoque() throws Exception {
        UUID semEstoque = criarProduto("Máscara");
        criarNova(null, produto(semEstoque, "1", "5.00"), "")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Máscara não tem estoque nesta filial"));

        mockMvc.perform(get("/consultas/preco").header(AUTHORIZATION, token)
                        .param("filialId", loja.toString()).param("produtoId", luva.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precoUnitario").value(2.5))
                .andExpect(jsonPath("$.controlaEstoque").value(true))
                .andExpect(jsonPath("$.saldo").value(10))
                .andExpect(jsonPath("$.unidadeSigla").value("UN"));
        mockMvc.perform(get("/consultas/preco").header(AUTHORIZATION, token)
                        .param("filialId", loja.toString()).param("servicoId", avaliacao.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precoUnitario").doesNotExist());

        // O combo traz só o que tem estoque na filial, com controle ou sem
        mockMvc.perform(get("/consultas/produtos").header(AUTHORIZATION, token)
                        .param("filialId", loja.toString()))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nome").value("Gel"))
                .andExpect(jsonPath("$[1].nome").value("Luva"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Ajuste e totais
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("guardas do ajuste por item e geral: percentual até 100, desconto até a base, os três juntos, valor > 0")
    void guardasDeAjuste() throws Exception {
        criarNova(servicoComAjuste(limpeza, 1, "DESCONTO", "PERCENTUAL", "101"), null, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Ajuste de Limpeza: o percentual vai até 100"));
        criarNova(servicoComAjuste(limpeza, 1, "DESCONTO", "FIXO", "150.01"), null, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Desconto de Limpeza passa do valor do item (R$ 150,00)"));
        criarNova(servicoComAjuste(limpeza, 1, "DESCONTO", null, "10"), null, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Ajuste de Limpeza: informe o tipo, o cálculo e o valor juntos"));
        criarNova(servicoComAjuste(limpeza, 1, "ACRESCIMO", "FIXO", "0"), null, "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Ajuste de Limpeza: o valor tem de ser maior que zero"));
        criarNova(servico(limpeza, 1, null), null, ajusteGeral("DESCONTO", "FIXO", "150.01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Desconto geral passa do subtotal (R$ 150,00)"));
        criarNova(servico(limpeza, 1, null), null, ajusteGeral("ACRESCIMO", "PERCENTUAL", "100.5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Ajuste geral: o percentual vai até 100"));

        assertThat(consultaRepository.findAll()).isEmpty();
        // Um desconto do tamanho da base passa: o total fica zero, não negativo
        criarNova(servicoComAjuste(limpeza, 1, "DESCONTO", "PERCENTUAL", "100"), null, "")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    @DisplayName("os totais publicados fecham: total = Σ itens + ajuste geral, e o /calculo dá o mesmo sem gravar")
    void totais() throws Exception {
        String servicos = servicoComAjuste(limpeza, 2, "DESCONTO", "PERCENTUAL", "10");      // 300 − 30
        String produtos = produtoComAjuste(luva, "3", "ACRESCIMO", "FIXO", "1") + ","        // 7,50 + 1
                + produto(gel, "1", null);                                                    // 30
        String geral = ajusteGeral("DESCONTO", "FIXO", "8.50");

        JsonNode calculo = corpo(mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"filialId":"%s","servicos":[%s],"produtos":[%s]%s}
                                """.formatted(loja, servicos, produtos, geral)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(150.0))
                .andExpect(jsonPath("$.servicos[0].subtotal").value(300.0))
                .andExpect(jsonPath("$.servicos[0].ajuste").value(-30.0))
                .andExpect(jsonPath("$.servicos[0].total").value(270.0))
                .andExpect(jsonPath("$.produtos[0].total").value(8.5))
                .andExpect(jsonPath("$.subtotalServicos").value(270.0))
                .andExpect(jsonPath("$.subtotalProdutos").value(38.5))
                .andExpect(jsonPath("$.subtotal").value(308.5))
                .andExpect(jsonPath("$.ajusteGeral").value(-8.5))
                .andExpect(jsonPath("$.total").value(300.0)));
        assertThat(consultaRepository.findAll()).isEmpty();
        assertThat(compromissoRepository.findAll()).isEmpty();

        JsonNode salva = corpo(criarNova(servicos, produtos, geral).andExpect(status().isCreated()));
        for (String campo : List.of("subtotalServicos", "subtotalProdutos", "subtotal", "ajusteGeral", "total")) {
            assertThat(salva.get(campo).decimalValue()).isEqualByComparingTo(calculo.get(campo).decimalValue());
        }

        // A invariante, somando o que veio publicado
        BigDecimal somaItens = BigDecimal.ZERO;
        for (JsonNode item : salva.get("servicos")) somaItens = somaItens.add(item.get("total").decimalValue());
        for (JsonNode item : salva.get("produtos")) {
            somaItens = somaItens.add(item.get("total").decimalValue());
            assertThat(item.get("total").decimalValue()).isEqualByComparingTo(
                    item.get("subtotal").decimalValue().add(item.get("ajuste").decimalValue()));
        }
        assertThat(salva.get("subtotal").decimalValue()).isEqualByComparingTo(somaItens);
        assertThat(salva.get("total").decimalValue()).isEqualByComparingTo(
                somaItens.add(salva.get("ajusteGeral").decimalValue()));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Itens e permissão
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sem Serviços e Produtos: o response omite as listas, null mantém, lista enviada é 403")
    void itensPelaPermissao() throws Exception {
        UUID id = idDe(criarNova(servico(limpeza, 1, null), produto(luva, "2", null), "")
                .andExpect(status().isCreated()));

        conceder(userA, Tela.CONSULTAS, NivelAcesso.ESCRITA);
        String user = autenticar(userA.getEmail());

        mockMvc.perform(get("/consultas/{id}", id).header(AUTHORIZATION, user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos").doesNotExist())
                .andExpect(jsonPath("$.produtos").doesNotExist())
                .andExpect(jsonPath("$.total").value(155.0));

        // Listas nulas: salva o resto e não apaga o que existe
        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content(atualizacao(INICIO, FIM, null, null, ",\"observacao\":\"Voltou\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.observacao").value("Voltou"));
        buscar(id)
                .andExpect(jsonPath("$.servicos", hasSize(1)))
                .andExpect(jsonPath("$.produtos", hasSize(1)));

        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content(atualizacao(INICIO, FIM, "[]", null, "")))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content(atualizacao(INICIO, FIM, null, "[]", "")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/consultas/preco").header(AUTHORIZATION, user)
                        .param("filialId", loja.toString()).param("servicoId", limpeza.toString()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/consultas/produtos").header(AUTHORIZATION, user)
                        .param("filialId", loja.toString()))
                .andExpect(status().isForbidden());
        // O total de quem não vê os itens continua certo: a lista que não vem é a gravada
        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content("""
                                {"consultaId":"%s","filialId":"%s"%s}
                                """.formatted(id, loja, ajusteGeral("DESCONTO", "FIXO", "5"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(150.0));
        buscar(id).andExpect(jsonPath("$.servicos", hasSize(1)));

        // Com Serviços liberado, a lista aparece e se mexe
        conceder(userA, Tela.SERVICOS, NivelAcesso.LEITURA);
        mockMvc.perform(get("/consultas/{id}", id).header(AUTHORIZATION, user))
                .andExpect(jsonPath("$.servicos", hasSize(1)))
                .andExpect(jsonPath("$.produtos").doesNotExist());
        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content(atualizacao(INICIO, FIM, "[]", null, "")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos", hasSize(0)));
        buscar(id).andExpect(jsonPath("$.produtos", hasSize(1)));
    }

    /**
     * A prévia de uma consulta gravada lê as listas gravadas para o total; sem
     * esta guarda, devolvia item por item — preço e ajuste de cada serviço e
     * produto — a quem a tela da consulta esconde as listas.
     */
    @Test
    @DisplayName("o /calculo da gravada omite as listas para quem não lê Serviços/Produtos, e o total segue certo")
    void calculoDaGravadaOmiteAsListasSemLeitura() throws Exception {
        UUID id = idDe(criarNova(servico(limpeza, 1, null), produto(luva, "2", null), "")
                .andExpect(status().isCreated()));

        conceder(userA, Tela.CONSULTAS, NivelAcesso.ESCRITA);
        String user = autenticar(userA.getEmail());
        String corpo = "{\"consultaId\":\"%s\",\"filialId\":\"%s\"}".formatted(id, loja);

        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, user)
                        .contentType("application/json").content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos").doesNotExist())
                .andExpect(jsonPath("$.produtos").doesNotExist())
                .andExpect(jsonPath("$.subtotalServicos").value(150.0))
                .andExpect(jsonPath("$.subtotalProdutos").value(5.0))
                .andExpect(jsonPath("$.total").value(155.0));

        // Uma liberada, a outra não: cada lista pela sua tela
        conceder(userA, Tela.SERVICOS, NivelAcesso.LEITURA);
        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, user)
                        .contentType("application/json").content(corpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicos", hasSize(1)))
                .andExpect(jsonPath("$.produtos").doesNotExist())
                .andExpect(jsonPath("$.total").value(155.0));
    }

    /**
     * Trocar a filial confere o estoque dos produtos gravados — mas a recusa
     * não pode dizer o nome do produto a quem não lê Produtos.
     */
    @Test
    @DisplayName("filial nova sem estoque: quem não lê Produtos recebe a recusa sem o nome do produto")
    void filialNovaSemEstoqueNaoNomeiaOProdutoSemLeitura() throws Exception {
        UUID outra = criarMatriz(token, salvarPessoa(tenantA, "Clínica Bairro").getId());
        UUID id = idDe(criarNova(null, produto(luva, "1", null), "").andExpect(status().isCreated()));
        String naOutra = compromissoJson(INICIO, FIM).replace(loja.toString(), outra.toString());

        conceder(userA, Tela.CONSULTAS, NivelAcesso.ESCRITA);
        String user = autenticar(userA.getEmail());
        String generica = "Um dos produtos desta consulta não tem estoque nesta filial";

        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content("{\"consultaId\":\"%s\",\"filialId\":\"%s\"}".formatted(id, outra)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(generica));
        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, user)
                        .contentType("application/json")
                        .content("{\"compromisso\":%s}".formatted(naOutra)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(generica));
        buscar(id).andExpect(jsonPath("$.compromisso.filialId").value(loja.toString()));
    }

    /**
     * Concluir baixa o estoque, e a recusa da baixa nomeava o produto e dizia
     * o saldo — a quem a tela esconde os produtos. Para ele a recusa é
     * genérica; o rollback continua total.
     */
    @Test
    @DisplayName("concluir sem saldo: quem não lê Produtos recebe a recusa sem o nome nem o saldo, e nada baixa")
    void concluirSemSaldoNaoNomeiaOProdutoSemLeitura() throws Exception {
        UUID id = idDe(criarNova(null, produto(luva, "11", null), "").andExpect(status().isCreated()));

        conceder(userA, Tela.CONSULTAS, NivelAcesso.ESCRITA);
        String user = autenticar(userA.getEmail());

        mockMvc.perform(patch("/consultas/{id}/concluir", id).header(AUTHORIZATION, user))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Um dos produtos desta consulta não tem saldo nesta filial"));
        assertThat(estoqueRepository.findById(luvaEstoque).orElseThrow().getQuantidade()).isEqualByComparingTo("10");
        assertThat(saidasPorConsulta()).isEmpty();
        buscar(id).andExpect(jsonPath("$.compromisso.status").value("AGENDADO"));

        // As outras recusas da baixa também nomeavam: estoque inativo na filial
        mockMvc.perform(patch("/estoques/{id}/ativo", luvaEstoque).header(AUTHORIZATION, token)
                        .param("ativo", "false"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/consultas/{id}/concluir", id).header(AUTHORIZATION, user))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Um dos produtos desta consulta não tem estoque nesta filial"));
        buscar(id).andExpect(jsonPath("$.compromisso.status").value("AGENDADO"));
    }

    @Test
    @DisplayName("concluir sem saldo: quem lê Produtos continua recebendo o nome e o saldo")
    void concluirSemSaldoNomeiaOProdutoComLeitura() throws Exception {
        UUID id = idDe(criarNova(null, produto(luva, "11", null), "").andExpect(status().isCreated()));

        acao(id, "concluir")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Saldo insuficiente de Luva na filial Clínica Centro: há 10 UN"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Situação
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("concluir baixa o que controla estoque, não o que não controla, e o compromisso fica concluído")
    void concluirBaixa() throws Exception {
        UUID id = idDe(criarNova(null, produto(luva, "3", null) + "," + produto(gel, "1", null) + ","
                + produto(luva, "1", null), "").andExpect(status().isCreated()));

        buscar(id).andExpect(jsonPath("$.produtos[0].saldoDisponivel").value(10))
                .andExpect(jsonPath("$.produtos[0].controlaEstoque").value(true))
                .andExpect(jsonPath("$.produtos[1].controlaEstoque").value(false))
                .andExpect(jsonPath("$.produtos[1].saldoDisponivel").doesNotExist());

        acao(id, "iniciar").andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("EM_ATENDIMENTO"));
        acao(id, "concluir").andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("CONCLUIDO"))
                .andExpect(jsonPath("$.produtos[0].saldoDisponivel").value(6));

        assertThat(estoqueRepository.findById(luvaEstoque).orElseThrow().getQuantidade()).isEqualByComparingTo("6");
        List<EstoqueMovimentacao> saidas = saidasPorConsulta();
        // A luva repetida somou numa baixa só; o gel não controla e não baixou
        assertThat(saidas).hasSize(1);
        assertThat(saidas.getFirst().getQuantidade()).isEqualByComparingTo("-4");
        assertThat(saidas.getFirst().getConsultaId()).isEqualTo(id);

        // Concluída não volta e não se altera
        acao(id, "concluir").andExpect(status().isConflict());
        alterar(id, atualizacao(INICIO, FIM, null, null, ""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso já foi concluído"));
    }

    @Test
    @DisplayName("sem saldo, concluir recusa nomeando o produto e desfaz tudo — inclusive a baixa que já tinha passado")
    void concluirSemSaldoDesfaz() throws Exception {
        // As baixas vão em ordem de id do produto: o primeiro tem saldo, o segundo não
        UUID outro = criarProduto("Máscara");
        UUID primeiro = luva.compareTo(outro) < 0 ? luva : outro;
        UUID segundo = primeiro.equals(luva) ? outro : luva;
        UUID estoqueOutro = abrirEstoque(outro, "5.00", true, "10");
        UUID estoqueDoSegundo = segundo.equals(luva) ? luvaEstoque : estoqueOutro;
        mockMvc.perform(post("/estoques/{id}/ajustes", estoqueDoSegundo).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("{\"quantidadeNova\":1,\"motivo\":\"Contagem\"}"))
                .andExpect(status().isCreated());
        String nomeDoSegundo = segundo.equals(luva) ? "Luva" : "Máscara";

        UUID id = idDe(criarNova(null, produto(primeiro, "3", null) + "," + produto(segundo, "2", null), "")
                .andExpect(status().isCreated()));

        acao(id, "concluir")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        "Saldo insuficiente de " + nomeDoSegundo + " na filial Clínica Centro: há 1 UN"));

        assertThat(estoqueRepository.findById(luvaEstoque).orElseThrow().getQuantidade())
                .isEqualByComparingTo(segundo.equals(luva) ? "1" : "10");
        assertThat(estoqueRepository.findById(estoqueOutro).orElseThrow().getQuantidade())
                .isEqualByComparingTo(segundo.equals(luva) ? "10" : "1");
        assertThat(saidasPorConsulta()).isEmpty();
        buscar(id).andExpect(jsonPath("$.compromisso.status").value("AGENDADO"));
    }

    @Test
    @DisplayName("em atendimento ocupa o horário, não se confirma e não se inicia de novo")
    void emAtendimento() throws Exception {
        UUID id = idDe(criarNova(null, null, "").andExpect(status().isCreated()));
        UUID compromisso = compromissoDe(id);
        acao(id, "iniciar").andExpect(status().isOk());
        acao(id, "iniciar").andExpect(status().isConflict());

        mockMvc.perform(patch("/compromissos/{id}/confirmar", compromisso).header(AUTHORIZATION, token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso já está em atendimento"));
        mockMvc.perform(post("/compromissos").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(compromissoJson("2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("a agenda não conclui consulta (409); cancelar pela agenda cancela a consulta — a situação é uma só")
    void agendaEConsulta() throws Exception {
        UUID id = idDe(criarNova(null, produto(luva, "1", null), "").andExpect(status().isCreated()));
        UUID compromisso = compromissoDe(id);

        mockMvc.perform(patch("/compromissos/{id}/concluir", compromisso).header(AUTHORIZATION, token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso é uma consulta: conclua pela consulta"));
        assertThat(saidasPorConsulta()).isEmpty();

        // Tirar o cliente pela agenda também não pode
        mockMvc.perform(put("/compromissos/{id}", compromisso).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(compromissoJsonCom(null, INICIO, FIM)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("A consulta precisa de um cliente"));

        mockMvc.perform(patch("/compromissos/{id}/cancelar", compromisso).header(AUTHORIZATION, token)
                        .contentType("application/json").content("{\"motivo\":\"Desmarcou\"}"))
                .andExpect(status().isOk());
        buscar(id)
                .andExpect(jsonPath("$.compromisso.status").value("CANCELADO"))
                .andExpect(jsonPath("$.compromisso.motivoCancelamento").value("Desmarcou"));
        acao(id, "concluir").andExpect(status().isConflict());
    }

    @Test
    @DisplayName("cancelar e falta pela consulta mudam o compromisso")
    void cancelarEFaltaPelaConsulta() throws Exception {
        UUID id = idDe(criarNova(null, null, "").andExpect(status().isCreated()));
        mockMvc.perform(patch("/consultas/{id}/cancelar", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("CANCELADO"));
        assertThat(compromissoRepository.findAll().getFirst().getStatus()).isEqualTo(StatusCompromisso.CANCELADO);

        UUID passada = idDe(criar(nova(compromissoJson("2020-01-10T13:00:00Z", "2020-01-10T14:00:00Z"),
                null, null, "")).andExpect(status().isCreated()));
        acao(passada, "faltou").andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("FALTOU"));
    }

    @Test
    @DisplayName("em atendimento não vira falta, nem pela consulta nem pela agenda: conclui-se ou cancela-se")
    void emAtendimentoNaoFalta() throws Exception {
        UUID id = idDe(criar(nova(compromissoJson("2020-01-10T13:00:00Z", "2020-01-10T14:00:00Z"),
                null, null, "")).andExpect(status().isCreated()));
        acao(id, "iniciar").andExpect(status().isOk());

        acao(id, "faltou")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Em atendimento: conclua ou cancele"));
        mockMvc.perform(patch("/compromissos/{id}/faltou", compromissoDe(id)).header(AUTHORIZATION, token))
                .andExpect(status().isConflict());
        buscar(id).andExpect(jsonPath("$.compromisso.status").value("EM_ATENDIMENTO"));
    }

    @Test
    @DisplayName("cancelar pela consulta cancela só ela: o escopo da série é da agenda (400), e as outras datas ficam")
    void cancelarPelaConsultaNaoLevaASerie() throws Exception {
        JsonNode serie = corpo(mockMvc.perform(post("/compromissos").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(compromissoJson(INICIO, FIM).replaceFirst("}$",
                                ",\"recorrencia\":{\"tipo\":\"SEMANAL\",\"quantidade\":3}}")))
                .andExpect(status().isCreated()));
        UUID primeira = UUID.fromString(serie.get(0).get("id").asText());
        UUID id = idDe(criar("{\"compromissoId\":\"%s\"}".formatted(primeira)).andExpect(status().isCreated()));

        mockMvc.perform(patch("/consultas/{id}/cancelar", id).header(AUTHORIZATION, token)
                        .contentType("application/json").content("{\"escopo\":\"SEGUINTES\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(
                        "Pela consulta cancela-se só ela: a série se cancela pela agenda"));

        mockMvc.perform(patch("/consultas/{id}/cancelar", id).header(AUTHORIZATION, token)
                        .contentType("application/json").content("{\"motivo\":\"Desmarcou\",\"escopo\":\"ESTE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("CANCELADO"));
        assertThat(compromissoRepository.findAll().stream()
                .filter(c -> c.getStatus() == StatusCompromisso.AGENDADO)).hasSize(2);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Filial e itens com a consulta andando
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a agenda não troca a filial de uma consulta (409): o estoque e o preço se conferem pela consulta")
    void filialNaoMudaPelaAgenda() throws Exception {
        UUID outra = criarMatriz(token, salvarPessoa(tenantA, "Clínica Bairro").getId());
        UUID id = idDe(criarNova(null, produto(luva, "1", null), "").andExpect(status().isCreated()));
        UUID compromisso = compromissoDe(id);

        mockMvc.perform(put("/compromissos/{id}", compromisso).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(compromissoJson(INICIO, FIM).replace(loja.toString(), outra.toString())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso é uma consulta: mude a filial pela consulta"));
        buscar(id).andExpect(jsonPath("$.compromisso.filialId").value(loja.toString()));

        // O resto do compromisso continua se alterando pela agenda
        mockMvc.perform(put("/compromissos/{id}", compromisso).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content(compromissoJson(INICIO, "2027-03-10T14:30:00Z")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("trocar a filial pela consulta confere o estoque dos produtos na filial nova — mandando a lista ou não, e na prévia")
    void filialNovaSemEstoque() throws Exception {
        UUID outra = criarMatriz(token, salvarPessoa(tenantA, "Clínica Bairro").getId());
        JsonNode criada = corpo(criarNova(null, produto(luva, "1", null), "").andExpect(status().isCreated()));
        UUID id = UUID.fromString(criada.get("id").asText());
        String itemId = criada.get("produtos").get(0).get("id").asText();
        String naOutra = compromissoJson(INICIO, FIM).replace(loja.toString(), outra.toString());

        alterar(id, """
                {"compromisso":%s,"produtos":[{"id":"%s","produtoId":"%s","quantidade":1}]}
                """.formatted(naOutra, itemId, luva))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Luva não tem estoque nesta filial"));
        alterar(id, "{\"compromisso\":%s}".formatted(naOutra))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Luva não tem estoque nesta filial"));
        buscar(id).andExpect(jsonPath("$.compromisso.filialId").value(loja.toString()));

        // A prévia faz a mesma conferência que o salvar
        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"consultaId":"%s","filialId":"%s","produtos":[{"id":"%s","produtoId":"%s","quantidade":1}]}
                                """.formatted(id, outra, itemId, luva)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Luva não tem estoque nesta filial"));
        mockMvc.perform(post("/consultas/calculo").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("{\"consultaId\":\"%s\",\"filialId\":\"%s\"}".formatted(id, outra)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("em atendimento os itens ainda mudam: o que se usou se acerta durante a consulta")
    void itensEmAtendimento() throws Exception {
        UUID id = idDe(criarNova(servico(limpeza, 1, null), null, "").andExpect(status().isCreated()));
        acao(id, "iniciar").andExpect(status().isOk());

        alterar(id, atualizacao(INICIO, FIM, lista(servico(limpeza, 2, null) + "," + servico(avaliacao, 1, "40.00")),
                lista(produto(gel, "1", null)), ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compromisso.status").value("EM_ATENDIMENTO"))
                .andExpect(jsonPath("$.servicos", hasSize(2)))
                .andExpect(jsonPath("$.produtos", hasSize(1)))
                .andExpect(jsonPath("$.total").value(370.0));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Reconsulta
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("reconsulta: mesma filial e cliente, itens sem ajuste com o preço de hoje, e passa pelo conflito")
    void reconsulta() throws Exception {
        UUID id = idDe(criarNova(servicoComAjuste(limpeza, 1, "DESCONTO", "FIXO", "10") + ","
                        + servico(avaliacao, 1, "40.00"), produto(luva, "2", null),
                ajusteGeral("DESCONTO", "FIXO", "1")).andExpect(status().isCreated()));
        mockMvc.perform(put("/servicos/{id}", limpeza).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"nome":"Limpeza","filiais":[{"filialId":"%s","valor":180.00}]}
                                """.formatted(loja)))
                .andExpect(status().isOk());

        // O responsável está ocupado no horário pedido
        criarCompromisso(cliente, "2027-03-17T13:00:00Z", "2027-03-17T14:00:00Z");
        reconsultar(id, "2027-03-17T13:30:00Z", "2027-03-17T14:30:00Z").andExpect(status().isConflict());

        reconsultar(id, "2027-03-24T13:00:00Z", "2027-03-24T14:00:00Z")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consultaOrigemId").value(id.toString()))
                .andExpect(jsonPath("$.compromisso.status").value("AGENDADO"))
                .andExpect(jsonPath("$.compromisso.responsavelId").value(profissional.getId().toString()))
                .andExpect(jsonPath("$.compromisso.pessoaNome").value("Maria Cliente"))
                .andExpect(jsonPath("$.compromisso.inicio").value("2027-03-24T13:00:00Z"))
                .andExpect(jsonPath("$.servicos", hasSize(2)))
                .andExpect(jsonPath("$.servicos[0].precoUnitario").value(180.0))
                .andExpect(jsonPath("$.servicos[0].tipoAjuste").doesNotExist())
                // Sem valor na filial, fica o retrato antigo
                .andExpect(jsonPath("$.servicos[1].precoUnitario").value(40.0))
                .andExpect(jsonPath("$.produtos[0].quantidade").value(2))
                .andExpect(jsonPath("$.tipoAjusteGeral").doesNotExist())
                .andExpect(jsonPath("$.total").value(225.0));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Lista e isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a lista filtra pela situação, pelo cliente e pelo período, da mais recente para a mais antiga")
    void lista() throws Exception {
        UUID primeira = idDe(criarNova(servico(limpeza, 1, null), null, "").andExpect(status().isCreated()));
        UUID outroCliente = salvarPessoa(tenantA, "João Cliente").getId();
        idDe(criar(nova(compromissoJsonCom(outroCliente, "2027-04-10T13:00:00Z", "2027-04-10T14:00:00Z"),
                null, null, "")).andExpect(status().isCreated()));
        acao(primeira, "iniciar").andExpect(status().isOk());

        listar("").andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].pessoaNome").value("João Cliente"))
                .andExpect(jsonPath("$.content[1].total").value(150.0))
                .andExpect(jsonPath("$.content[1].filialNome").value("Clínica Centro"));
        listar("status=EM_ATENDIMENTO").andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(primeira.toString()));
        listar("pessoaId=" + outroCliente).andExpect(jsonPath("$.content", hasSize(1)));
        listar("de=2027-04-01T03:00:00Z").andExpect(jsonPath("$.content", hasSize(1)));
        listar("ate=2027-04-01T03:00:00Z").andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("isolamento: o tenant B não lê, não altera, não conclui e não converte o que é do A")
    void isolamento() throws Exception {
        UUID id = idDe(criarNova(servico(limpeza, 1, null), null, "").andExpect(status().isCreated()));
        UUID compromisso = compromissoDe(id);
        String b = autenticar(adminB.getEmail());

        mockMvc.perform(get("/consultas/{id}", id).header(AUTHORIZATION, b)).andExpect(status().isNotFound());
        mockMvc.perform(get("/consultas").header(AUTHORIZATION, b))
                .andExpect(jsonPath("$.content", hasSize(0)));
        mockMvc.perform(patch("/consultas/{id}/concluir", id).header(AUTHORIZATION, b))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, b)
                        .contentType("application/json").content(atualizacao(INICIO, FIM, null, null, "")))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/consultas").header(AUTHORIZATION, b)
                        .contentType("application/json")
                        .content("{\"compromissoId\":\"%s\"}".formatted(compromisso)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/consultas/{id}/reconsulta", id).header(AUTHORIZATION, b)
                        .contentType("application/json")
                        .content("{\"inicio\":\"2027-05-10T13:00:00Z\",\"fim\":\"2027-05-10T14:00:00Z\"}"))
                .andExpect(status().isNotFound());
        // O preço de outro tenant não vaza (o antigo vazava)
        mockMvc.perform(get("/consultas/preco").header(AUTHORIZATION, b)
                        .param("filialId", loja.toString()).param("servicoId", limpeza.toString()))
                .andExpect(status().isNotFound());
    }

    // ─────────────────────────────────────────────────────────────────

    private ResultActions criar(String json) throws Exception {
        return mockMvc.perform(post("/consultas").header(AUTHORIZATION, token)
                .contentType("application/json").content(json));
    }

    /** Uma consulta nova, com o compromisso junto no horário padrão. */
    private ResultActions criarNova(String servicos, String produtos, String geral) throws Exception {
        return criar(nova(compromissoJson(INICIO, FIM), servicos, produtos, geral));
    }

    private ResultActions alterar(UUID id, String json) throws Exception {
        return mockMvc.perform(put("/consultas/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json").content(json));
    }

    private ResultActions buscar(UUID id) throws Exception {
        return mockMvc.perform(get("/consultas/{id}", id).header(AUTHORIZATION, token)).andExpect(status().isOk());
    }

    private ResultActions acao(UUID id, String acao) throws Exception {
        return mockMvc.perform(patch("/consultas/{id}/" + acao, id).header(AUTHORIZATION, token));
    }

    private ResultActions listar(String filtro) throws Exception {
        return mockMvc.perform(get("/consultas?" + filtro).header(AUTHORIZATION, token)).andExpect(status().isOk());
    }

    private ResultActions reconsultar(UUID id, String inicio, String fim) throws Exception {
        return mockMvc.perform(post("/consultas/{id}/reconsulta", id).header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("{\"inicio\":\"%s\",\"fim\":\"%s\"}".formatted(inicio, fim)));
    }

    private static String nova(String compromisso, String servicos, String produtos, String geral) {
        return """
                {"compromisso":%s,"servicos":%s,"produtos":%s%s}
                """.formatted(compromisso, lista(servicos), lista(produtos), geral);
    }

    private String atualizacao(String inicio, String fim, String servicos, String produtos, String geral) {
        return """
                {"compromisso":%s,"servicos":%s,"produtos":%s%s}
                """.formatted(compromissoJson(inicio, fim), servicos, produtos, geral);
    }

    private static String lista(String itens) {
        return itens == null ? "null" : "[" + itens + "]";
    }

    private String compromissoJson(String inicio, String fim) {
        return compromissoJsonCom(cliente, inicio, fim);
    }

    private String compromissoJsonCom(UUID pessoaId, String inicio, String fim) {
        return """
                {"filialId":"%s","responsavelId":"%s","pessoaId":%s,"titulo":"Consulta",
                 "inicio":"%s","fim":"%s","convidadoIds":[]}""".formatted(loja, profissional.getId(),
                pessoaId != null ? "\"" + pessoaId + "\"" : "null", inicio, fim);
    }

    private static String servico(UUID servicoId, int quantidade, String preco) {
        return """
                {"servicoId":"%s","quantidade":%d,"precoUnitario":%s}""".formatted(servicoId, quantidade, preco);
    }

    private static String servicoComAjuste(UUID servicoId, int quantidade, String tipo, String calculo,
                                           String valor) {
        return """
                {"servicoId":"%s","quantidade":%d,"tipoAjuste":%s,"tipoCalculo":%s,"valorAjuste":%s}"""
                .formatted(servicoId, quantidade, texto(tipo), texto(calculo), valor);
    }

    private static String produto(UUID produtoId, String quantidade, String preco) {
        return """
                {"produtoId":"%s","quantidade":%s,"precoUnitario":%s}""".formatted(produtoId, quantidade, preco);
    }

    private static String produtoComAjuste(UUID produtoId, String quantidade, String tipo, String calculo,
                                           String valor) {
        return """
                {"produtoId":"%s","quantidade":%s,"tipoAjuste":%s,"tipoCalculo":%s,"valorAjuste":%s}"""
                .formatted(produtoId, quantidade, texto(tipo), texto(calculo), valor);
    }

    private static String ajusteGeral(String tipo, String calculo, String valor) {
        return """
                ,"tipoAjusteGeral":%s,"tipoCalculoGeral":%s,"valorAjusteGeral":%s"""
                .formatted(texto(tipo), texto(calculo), valor);
    }

    private static String texto(String valor) {
        return valor != null ? "\"" + valor + "\"" : "null";
    }

    private UUID criarCompromisso(UUID pessoaId, String inicio, String fim) throws Exception {
        return UUID.fromString(corpo(mockMvc.perform(post("/compromissos").header(AUTHORIZATION, token)
                        .contentType("application/json").content(compromissoJsonCom(pessoaId, inicio, fim)))
                .andExpect(status().isCreated())).get(0).get("id").asText());
    }

    private UUID compromissoDe(UUID consultaId) throws Exception {
        return UUID.fromString(corpo(buscar(consultaId)).get("compromisso").get("id").asText());
    }

    private List<EstoqueMovimentacao> saidasPorConsulta() {
        return estoqueMovimentacaoRepository.findAll().stream()
                .filter(m -> m.getTipo() == TipoMovimentacao.SAIDA_CONSULTA)
                .toList();
    }

    private UUID criarServico(String nome, String valor) throws Exception {
        return idDe(mockMvc.perform(post("/servicos").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"nome":"%s","filiais":[{"filialId":"%s","valor":%s}]}
                                """.formatted(nome, loja, valor)))
                .andExpect(status().isCreated()));
    }

    private UUID criarProduto(String nome) throws Exception {
        return idDe(mockMvc.perform(post("/produtos").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"nome":"%s","unidadeMedidaId":"%s"}
                                """.formatted(nome, unidade("UN"))))
                .andExpect(status().isCreated()));
    }

    private UUID abrirEstoque(UUID produtoId, String preco, boolean controla, String inicial) throws Exception {
        return idDe(mockMvc.perform(post("/estoques").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"produtoId":"%s","filialId":"%s","precoVenda":%s,"controlaEstoque":%s,
                                 "quantidadeInicial":%s}
                                """.formatted(produtoId, loja, preco, controla, inicial)))
                .andExpect(status().isCreated()));
    }

    private UUID criarMatriz(String tokenDo, UUID pessoaId) throws Exception {
        return idDe(mockMvc.perform(post("/filiais").header(AUTHORIZATION, tokenDo)
                        .contentType("application/json")
                        .content("""
                                {"pessoaId":"%s","tipo":"MATRIZ","cor":"#3B82F6"}
                                """.formatted(pessoaId)))
                .andExpect(status().isCreated()));
    }

    private UUID idDe(ResultActions resultado) throws Exception {
        return UUID.fromString(corpo(resultado).get("id").asText());
    }

    private JsonNode corpo(ResultActions resultado) throws Exception {
        return objectMapper.readTree(resultado.andReturn().getResponse().getContentAsString());
    }
}
