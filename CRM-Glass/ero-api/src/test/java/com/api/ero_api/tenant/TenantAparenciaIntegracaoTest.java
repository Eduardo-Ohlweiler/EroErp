package com.api.ero_api.tenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.support.IntegracaoTest;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;

/**
 * Aparência fixa por contratante: só o superadmin muda, todo usuário do
 * contratante recebe a mesma (em /api/auth/eu e /api/tenants/atual).
 */
class TenantAparenciaIntegracaoTest extends IntegracaoTest {

    private static final String PLATAFORMA = "00000000-0000-0000-0000-000000000000";

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TransactionTemplate tx;

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_criaSemAparenciaComPadraoEComAparenciaPropria() {
        Sessao s = loginSuperadmin();

        JsonNode padrao = corpo(criar(s, null)).path("aparencia");
        assertThat(padrao.path("corDestaque").asString()).isEqualTo("violeta");
        assertThat(padrao.path("temaPadrao").asString()).isEqualTo("ESCURO");
        assertThat(padrao.path("fundo").asString()).isEqualTo("ORBS");
        assertThat(padrao.path("fundoAnimado").asBoolean()).isTrue();
        assertThat(padrao.path("vidroDesfoque").asInt()).isEqualTo(12);
        assertThat(padrao.path("fundoFoco").decimalValue()).isEqualByComparingTo("3.0");
        assertThat(padrao.path("animacoes").asString()).isEqualTo("COMPLETAS");

        MvcTestResult criado = criar(s, aparencia("azul", "CLARO", "MARINA", false, 20, new BigDecimal("4.5"), "REDUZIDAS"));
        assertThat(status(criado)).isEqualTo(201);
        String id = corpo(criado).path("id").asString();
        JsonNode lido = corpo(get("/api/tenants/" + id, s.token()));
        JsonNode a = lido.path("aparencia");
        assertThat(a.path("corDestaque").asString()).isEqualTo("azul");
        assertThat(a.path("temaPadrao").asString()).isEqualTo("CLARO");
        assertThat(a.path("fundo").asString()).isEqualTo("MARINA");
        assertThat(a.path("fundoAnimado").asBoolean()).isFalse();
        assertThat(a.path("vidroDesfoque").asInt()).isEqualTo(20);
        assertThat(a.path("fundoFoco").decimalValue()).isEqualByComparingTo("4.5");
        assertThat(a.path("animacoes").asString()).isEqualTo("REDUZIDAS");
        assertThat(lido.path("fundoExclusivo").isNull()).isTrue();
        assertThat(lido.has("corDestaque")).as("cor saiu da raiz").isFalse();
    }

    @Test
    void caminhoFeliz_configuracaoValeParaOAdminNoEuENoAtual() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();

        long versao = versao(s, c.id());
        Map<String, Object> ap = aparencia("esmeralda", "CLARO", "CIDADE", true, 30, new BigDecimal("6"), "REDUZIDAS");
        MvcTestResult r = configurar(s, c.id(), ap, versao);
        assertThat(status(r)).isEqualTo(200);
        assertThat(corpo(r).path("aparencia").path("fundoFoco").decimalValue()).isEqualByComparingTo("6.0");
        long versaoNova = corpo(r).path("version").asLong();
        assertThat(versaoNova).as("resposta já traz a versão nova").isEqualTo(versao + 1);
        // A versão devolvida serve para salvar de novo sem 409 falso.
        assertThat(status(configurar(s, c.id(), ap, versaoNova))).isEqualTo(200);

        JsonNode eu = corpo(get("/api/auth/eu", c.admin().token())).path("aparencia");
        assertThat(eu.path("corDestaque").asString()).isEqualTo("esmeralda");
        assertThat(eu.path("temaPadrao").asString()).isEqualTo("CLARO");
        assertThat(eu.path("fundo").asString()).isEqualTo("CIDADE");
        assertThat(eu.path("vidroDesfoque").asInt()).isEqualTo(30);
        assertThat(eu.path("animacoes").asString()).isEqualTo("REDUZIDAS");

        JsonNode atual = corpo(get("/api/tenants/atual", c.admin().token()));
        assertThat(atual.path("aparencia").path("fundo").asString()).isEqualTo("CIDADE");
        assertThat(atual.path("exige2fa").asBoolean()).isFalse();

        // A renovação de sessão também leva a aparência.
        JsonNode renovado = corpo(refresh(c.admin().refresh()));
        assertThat(renovado.path("usuario").path("aparencia").path("corDestaque").asString()).isEqualTo("esmeralda");
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        long versao = versao(s, c.id());

        assertThat(campos(configurar(s, c.id(), aparencia("violeta", "ESCURO", "ORBS", true, 41, new BigDecimal("3"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.vidroDesfoque");
        assertThat(campos(configurar(s, c.id(), aparencia("violeta", "ESCURO", "ORBS", true, -1, new BigDecimal("3"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.vidroDesfoque");
        assertThat(campos(configurar(s, c.id(), aparencia("violeta", "ESCURO", "ORBS", true, 12, new BigDecimal("10.5"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.fundoFoco");
        assertThat(campos(configurar(s, c.id(), aparencia("violeta", "ESCURO", "ORBS", true, 12, new BigDecimal("3.25"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.fundoFoco");
        assertThat(campos(configurar(s, c.id(), aparencia("violeta", null, "ORBS", true, 12, new BigDecimal("3"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.temaPadrao");
        assertThat(campos(configurar(s, c.id(), aparencia("roxo-neon", "ESCURO", "ORBS", true, 12, new BigDecimal("3"), "COMPLETAS"), versao)))
                .containsExactly("aparencia.corDestaque");
        assertThat(campos(configurar(s, c.id(), null, versao))).containsExactly("aparencia");

        MvcTestResult praia = configurar(s, c.id(), aparencia("violeta", "ESCURO", "PRAIA", true, 12, new BigDecimal("3"), "COMPLETAS"), versao);
        assertThat(status(praia)).as("fundo fora do catálogo").isEqualTo(400);

        // Nada foi gravado: a versão continua a mesma.
        assertThat(versao(s, c.id())).isEqualTo(versao);
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        Sessao s = loginSuperadmin();
        assertThat(status(configurar(s, a.id(), aparencia("azul", "CLARO", "MARINA", true, 12, new BigDecimal("3"), "COMPLETAS"),
                versao(s, a.id())))).isEqualTo(200);
        assertThat(status(configurar(s, b.id(), aparencia("rosa", "ESCURO", "CIDADE", true, 12, new BigDecimal("3"), "COMPLETAS"),
                versao(s, b.id())))).isEqualTo(200);

        assertThat(fundoECor(corpo(get("/api/auth/eu", a.admin().token())).path("aparencia"))).isEqualTo("MARINA/azul");
        assertThat(fundoECor(corpo(get("/api/auth/eu", b.admin().token())).path("aparencia"))).isEqualTo("CIDADE/rosa");
        assertThat(fundoECor(corpo(get("/api/tenants/atual", a.admin().token())).path("aparencia"))).isEqualTo("MARINA/azul");
        assertThat(status(get("/api/tenants/" + b.id(), a.admin().token()))).as("admin de A não lê B").isEqualTo(403);

        // Superadmin recebe a aparência de onde está atuando.
        JsonNode emA = corpo(post("/api/auth/superadmin/acessar/" + a.id(), s.token(), Map.of()));
        assertThat(fundoECor(emA.path("usuario").path("aparencia"))).isEqualTo("MARINA/azul");
        JsonNode emB = corpo(post("/api/auth/superadmin/acessar/" + b.id(), emA.path("tokenAcesso").asString(), Map.of()));
        assertThat(fundoECor(emB.path("usuario").path("aparencia"))).isEqualTo("CIDADE/rosa");
        JsonNode fora = corpo(post("/api/auth/superadmin/sair", emB.path("tokenAcesso").asString(), Map.of()));
        assertThat(fora.path("usuario").path("tenantId").asString()).isEqualTo(PLATAFORMA);
        assertThat(fora.path("usuario").path("aparencia").path("fundo").asString()).as("Plataforma usa o padrão").isEqualTo("ORBS");
    }

    @Test
    void parPapel_soSuperadminConfiguraEQualquerUsuarioLiberadoLeAAtual() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        long versao = versao(s, c.id());
        Map<String, Object> ok = aparencia("laranja", "ESCURO", "AURORA", true, 12, new BigDecimal("3"), "COMPLETAS");

        assertThat(status(configurar(c.admin(), c.id(), ok, versao))).as("ADMIN não configura").isEqualTo(403);
        assertThat(status(get("/api/tenants/fundos?tenantId=" + c.id(), c.admin().token()))).isEqualTo(403);
        assertThat(status(get("/api/tenants/fundos", s.token()))).isEqualTo(200);

        UsuarioCriado u = novoUsuario(c.admin());
        Sessao pendente = login(u.email(), SENHA_FORTE);
        assertThat(status(get("/api/tenants/atual", pendente.token()))).as("com pendência").isEqualTo(403);
        JsonNode euPendente = corpo(get("/api/auth/eu", pendente.token()));
        assertThat(euPendente.path("pendencia").asString()).isEqualTo("TROCAR_SENHA");
        assertThat(euPendente.path("aparencia").path("corDestaque").asString()).as("aparência vem no /eu").isNotBlank();

        Sessao semGrupos = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        assertThat(status(get("/api/tenants/atual", semGrupos.token()))).as("USUARIO sem grupos").isEqualTo(200);
        assertThat(status(configurar(s, c.id(), ok, versao))).isEqualTo(200);
    }

    // ------------------------------------------------------------ regras

    @Test
    void versaoAntigaDaConflitoECadastroNaoMexeNaAparencia() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        long versao = versao(s, c.id());
        Map<String, Object> ap = aparencia("rosa", "CLARO", "ONDAS", true, 12, new BigDecimal("3"), "COMPLETAS");
        assertThat(status(configurar(s, c.id(), ap, versao))).isEqualTo(200);
        assertThat(status(configurar(s, c.id(), ap, versao))).as("versão antiga").isEqualTo(409);

        JsonNode t = corpo(get("/api/tenants/" + c.id(), s.token()));
        MvcTestResult cadastro = put("/api/tenants/" + c.id(), s.token(), Map.of(
                "nome", t.path("nome").asString(), "exige2fa", false, "version", t.path("version").asLong()));
        assertThat(status(cadastro)).isEqualTo(200);
        assertThat(corpo(cadastro).path("aparencia").path("fundo").asString()).as("PUT cadastral preserva a aparência")
                .isEqualTo("ONDAS");
    }

    @Test
    void superadminDentroDeContratanteNaoConfigura() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        long versao = versao(s, c.id());
        String dentro = corpo(post("/api/auth/superadmin/acessar/" + c.id(), s.token(), Map.of())).path("tokenAcesso").asString();
        MvcTestResult r = put("/api/tenants/" + c.id() + "/configuracao", dentro, Map.of(
                "aparencia", aparencia("azul", "ESCURO", "ORBS", true, 12, new BigDecimal("3"), "COMPLETAS"), "version", versao));
        assertThat(status(r)).isEqualTo(422);
    }

    @Test
    void cenaComumNaoPodeSerExclusivaEPlataformaNaoTemConfiguracao() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("aparencia", aparencia("azul", "ESCURO", "ESCRITORIO", true, 12, new BigDecimal("3"), "COMPLETAS"));
        corpo.put("fundoExclusivo", "ESCRITORIO");
        corpo.put("version", versao(s, c.id()));
        MvcTestResult r = put("/api/tenants/" + c.id() + "/configuracao", s.token(), corpo);
        assertThat(status(r)).isEqualTo(422);
        assertThat(corpo(r).path("detail").asString()).isEqualTo("Esta cena não é exclusiva.");

        assertThat(status(configurar(s, UUID.fromString(PLATAFORMA),
                aparencia("azul", "ESCURO", "ORBS", true, 12, new BigDecimal("3"), "COMPLETAS"), 0L))).isEqualTo(404);
        assertThat(status(get("/api/tenants/fundos?tenantId=" + PLATAFORMA, s.token()))).isEqualTo(404);
    }

    @Test
    void catalogoDeFundosTrazTodasAsCenasLivres() {
        Contratante c = novoContratante();
        JsonNode fundos = corpo(get("/api/tenants/fundos?tenantId=" + c.id(), loginSuperadmin().token()));
        assertThat(fundos.valueStream().map(f -> f.path("codigo").asString()))
                .contains("ORBS", "AURORA", "ONDAS", "MINIMO", "ESCRITORIO", "CIDADE", "MARINA", "EXPEDIENTE", "COWORKING");
        JsonNode marina = fundos.valueStream().filter(f -> f.path("codigo").asString().equals("MARINA")).findFirst().orElseThrow();
        assertThat(marina.path("rotulo").asString()).isEqualTo("Marina");
        assertThat(marina.path("tipo").asString()).isEqualTo("CENA");
        assertThat(marina.path("exclusiva").asBoolean()).isFalse();
    }

    /** Duas configurações ao mesmo tempo com a mesma cena exclusiva: o índice único do banco segura. */
    @Test
    void bancoNaoDeixaDuasEmpresasComAMesmaCenaExclusiva() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        String cena = "TESTE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        assertThatThrownBy(() -> tx.executeWithoutResult(st -> {
            jdbc.update("UPDATE tenant SET fundo_exclusivo = ? WHERE id = ?", cena, a.id());
            jdbc.update("UPDATE tenant SET fundo_exclusivo = ? WHERE id = ?", cena, b.id());
        })).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM tenant WHERE fundo_exclusivo = ?", Long.class, cena))
                .as("transação desfeita").isZero();
    }

    // ------------------------------------------------------------ apoio

    private MvcTestResult criar(Sessao s, Map<String, Object> aparencia) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("nome", unico("Empresa"));
        corpo.put("exige2fa", false);
        if (aparencia != null) {
            corpo.put("aparencia", aparencia);
        }
        corpo.put("administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE));
        MvcTestResult r = post("/api/tenants", s.token(), corpo);
        assertThat(status(r)).as("criar contratante").isEqualTo(201);
        return r;
    }

    private MvcTestResult configurar(Sessao s, UUID tenantId, Map<String, Object> aparencia, long versao) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("aparencia", aparencia);
        corpo.put("version", versao);
        return put("/api/tenants/" + tenantId + "/configuracao", s.token(), corpo);
    }

    private long versao(Sessao superadmin, UUID tenantId) {
        return corpo(get("/api/tenants/" + tenantId, superadmin.token())).path("version").asLong();
    }

    private java.util.List<String> campos(MvcTestResult r) {
        assertThat(status(r)).isEqualTo(400);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }

    private static String fundoECor(JsonNode aparencia) {
        return aparencia.path("fundo").asString() + "/" + aparencia.path("corDestaque").asString();
    }

    /** LinkedHashMap aceita null (Map.of não), para testar campo ausente. */
    private static Map<String, Object> aparencia(String cor, String tema, String fundo, boolean animado, int vidro,
                                                 BigDecimal foco, String animacoes) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("corDestaque", cor);
        m.put("temaPadrao", tema);
        m.put("fundo", fundo);
        m.put("fundoAnimado", animado);
        m.put("vidroDesfoque", vidro);
        m.put("fundoFoco", foco);
        m.put("animacoes", animacoes);
        return m;
    }
}
