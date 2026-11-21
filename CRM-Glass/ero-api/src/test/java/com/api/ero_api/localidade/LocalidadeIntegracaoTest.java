package com.api.ero_api.localidade;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import com.api.ero_api.support.ViaCepFake;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Cidades do IBGE e CEP. O ViaCEP é o {@link ViaCepFake} (nenhum teste sai para a
 * internet). Cidade e CEP são de todos ({@code ACESSO_LIBERADO}): não há grupo para o
 * par LER/ESCREVER, e o "isolamento" aqui é não ter tenant (referência igual para todos).
 */
class LocalidadeIntegracaoTest extends IntegracaoTest {

    private static final String SE = """
            {"cep": "01001-000", "logradouro": "Praça da Sé", "complemento": "lado ímpar", "unidade": "",
             "bairro": "Sé", "localidade": "São Paulo", "uf": "SP", "estado": "São Paulo", "regiao": "Sudeste",
             "ibge": "3550308", "gia": "1004", "ddd": "11", "siafi": "7107"}
            """;

    @Autowired
    private JdbcTemplate jdbc;

    private String token;

    @BeforeEach
    void usuarioSemNenhumGrupo() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        token = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2).token();
    }

    // ------------------------------------------------------------ base do IBGE

    @Test
    void semente_27UfsE5571MunicipiosComNomeDeBuscaIgualAoDoJava() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM estado", Long.class)).isEqualTo(27);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM cidade", Long.class)).isEqualTo(5571);
        List<String[]> nomes = jdbc.query("SELECT nome, nome_busca FROM cidade",
                (rs, i) -> new String[] {rs.getString(1), rs.getString(2)});
        assertThat(nomes).allSatisfy(n -> assertThat(n[1]).as(n[0])
                .isEqualTo(com.api.ero_api.compartilhado.util.TextoBusca.normalizar(n[0])));
    }

    // ------------------------------------------------------------ cidades

    @Test
    void cidades_buscaSemAcentoESemCaixaEFiltroPorUf() {
        JsonNode r = corpo(get("/api/cidades/selecao?busca=SAO PAULO&uf=SP", token));
        assertThat(r.valueStream().map(n -> n.path("nome").asString())).contains("São Paulo");
        assertThat(r.valueStream().map(n -> n.path("uf").asString())).containsOnly("SP");

        JsonNode semAcento = corpo(get("/api/cidades/selecao?busca=florianopolis", token));
        assertThat(semAcento.size()).isEqualTo(1);
        assertThat(semAcento.get(0).path("nome").asString()).isEqualTo("Florianópolis");
        assertThat(semAcento.get(0).path("uf").asString()).isEqualTo("SC");

        assertThat(corpo(get("/api/cidades/selecao?busca=sao&uf=RS", token)).valueStream()
                .map(n -> n.path("uf").asString())).containsOnly("RS");
        assertThat(corpo(get("/api/cidades/selecao?uf=", token)).size()).as("UF vazia = todas, até 50").isEqualTo(50);
        assertThat(corpo(get("/api/cidades/selecao", token)).size()).isEqualTo(50);
    }

    @Test
    void cidades_validacaoRecusada() {
        assertThat(campos(get("/api/cidades/selecao?busca=" + "a".repeat(101), token))).containsExactly("busca");
        assertThat(campos(get("/api/cidades/selecao?uf=sp", token))).containsExactly("uf");
        assertThat(campos(get("/api/cidades/selecao?uf=SPX", token))).containsExactly("uf");
    }

    @Test
    void cidadesECep_soComSessaoLiberada() {
        assertThat(status(get("/api/cidades/selecao", null))).isEqualTo(401);
        assertThat(status(get("/api/cep/01001000", null))).isEqualTo(401);

        // Senha temporária ainda não trocada: pendência, sem ACESSO_LIBERADO.
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao pendente = loginComCodigo(u.email(), SENHA_FORTE);
        assertThat(status(get("/api/cidades/selecao", pendente.token()))).isEqualTo(403);
        assertThat(status(get("/api/cep/01001000", pendente.token()))).isEqualTo(403);
    }

    // ------------------------------------------------------------ CEP

    @Test
    void cep_caminhoFeliz() {
        String cep = cepUnico();
        ViaCepFake.responder(cep, 200, SE);
        MvcTestResult r = get("/api/cep/" + cep, token);
        assertThat(status(r)).isEqualTo(200);
        JsonNode e = corpo(r);
        assertThat(e.path("cep").asString()).isEqualTo(cep);
        assertThat(e.path("rua").asString()).isEqualTo("Praça da Sé");
        assertThat(e.path("bairro").asString()).isEqualTo("Sé");
        assertThat(e.path("cepUnico").asBoolean()).isFalse();
        assertThat(e.path("cidade").path("nome").asString()).isEqualTo("São Paulo");
        assertThat(e.path("cidade").path("uf").asString()).isEqualTo("SP");
        UUID cidadeId = UUID.fromString(e.path("cidade").path("id").asString());
        assertThat(jdbc.queryForObject("SELECT codigo_ibge FROM cidade WHERE id = ?", Integer.class, cidadeId))
                .isEqualTo(3550308);
        assertThat(e.has("complemento")).as("complemento e número ficam com o usuário").isFalse();
    }

    @Test
    void cep_unicoDaCidadeVemSemRuaNemBairro() {
        String cep = cepUnico();
        ViaCepFake.responder(cep, 200, """
                {"cep": "89900-000", "logradouro": "", "bairro": "", "localidade": "São Miguel do Oeste",
                 "uf": "SC", "ibge": "4217204"}
                """);
        JsonNode e = corpo(get("/api/cep/" + cep, token));
        assertThat(e.path("cepUnico").asBoolean()).isTrue();
        assertThat(e.path("rua").isNull()).isTrue();
        assertThat(e.path("bairro").isNull()).isTrue();
        assertThat(e.path("cidade").path("nome").asString()).isEqualTo("São Miguel do Oeste");
    }

    @Test
    void cep_ibgeForaDaBaseVemSemCidade() {
        String cep = cepUnico();
        ViaCepFake.responder(cep, 200, """
                {"cep": "01001-000", "logradouro": "Rua A", "bairro": "Centro", "ibge": "9999999"}
                """);
        JsonNode e = corpo(get("/api/cep/" + cep, token));
        assertThat(e.path("cidade").isNull()).isTrue();
        assertThat(e.path("rua").asString()).isEqualTo("Rua A");
    }

    /** O ViaCEP responde {@code "erro": "true"} (texto) hoje; o booleano também vale. */
    @Test
    void cep_inexistente404() {
        String texto = cepUnico();
        ViaCepFake.responder(texto, 200, "{\"erro\": \"true\"}");
        MvcTestResult r = get("/api/cep/" + texto, token);
        assertThat(status(r)).isEqualTo(404);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("CEP não encontrado.");

        String booleano = cepUnico();
        ViaCepFake.responder(booleano, 200, "{\"erro\": true}");
        assertThat(status(get("/api/cep/" + booleano, token))).isEqualTo(404);
    }

    @Test
    void cep_foraDe8DigitosRecusadoSemChamarOViaCep() {
        for (String invalido : List.of("0100100", "010010000", "01001-000", "abcdefgh", "0100100a")) {
            MvcTestResult r = get("/api/cep/" + invalido, token);
            assertThat(status(r)).as(invalido).isEqualTo(400);
            assertThat(corpo(r).path("codigo").asString()).isEqualTo("VALIDACAO");
            assertThat(corpo(r).path("erros").get(0).path("campo").asString()).isEqualTo("cep");
            assertThat(corpo(r).path("erros").get(0).path("mensagem").asString()).isEqualTo("CEP deve ter 8 dígitos.");
            assertThat(ViaCepFake.chamadas(invalido)).isZero();
        }
    }

    @Test
    void cep_viaCepComErroDa503() {
        String cep = cepUnico();
        ViaCepFake.responder(cep, 500, "{}");
        MvcTestResult r = get("/api/cep/" + cep, token);
        assertThat(status(r)).isEqualTo(503);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo("SERVICO_INDISPONIVEL");
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Consulta de CEP indisponível. Preencha o endereço à mão.");
    }

    @Test
    void cep_naoSegueRedirecionamento() {
        String cep = cepUnico();
        String destino = cepUnico();
        ViaCepFake.responder(destino, 200, SE);
        ViaCepFake.redirecionar(cep, destino);
        assertThat(status(get("/api/cep/" + cep, token))).isEqualTo(503);
        assertThat(ViaCepFake.chamadas(cep)).isEqualTo(1);
        assertThat(ViaCepFake.chamadas(destino)).as("o redirecionamento não foi seguido").isZero();
    }

    @Test
    void cep_demoraMaisDe3SegundosDa503() {
        String cep = cepUnico();
        ViaCepFake.atrasar(cep, 5_000, SE);
        long inicio = System.nanoTime();
        assertThat(status(get("/api/cep/" + cep, token))).isEqualTo(503);
        long segundos = java.time.Duration.ofNanos(System.nanoTime() - inicio).toSeconds();
        assertThat(segundos).as("desiste nos 3 s").isLessThan(5);
    }

    // ------------------------------------------------------------ apoio

    /** CEP de 8 dígitos que nenhum outro teste usa (o ViaCepFake guarda a resposta por CEP). */
    private static String cepUnico() {
        return String.format("%08d", Math.floorMod(UUID.randomUUID().getLeastSignificantBits(), 100_000_000L));
    }

    private List<String> campos(MvcTestResult r) {
        assertThat(status(r)).isEqualTo(400);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }
}
