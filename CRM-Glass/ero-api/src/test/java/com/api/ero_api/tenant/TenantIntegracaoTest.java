package com.api.ero_api.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auxiliar.enums.EstadoCivilDoSistema;
import com.api.ero_api.auxiliar.enums.ProfissaoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoCadastroDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEmailDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEnderecoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoRedeSocialDoSistema;
import com.api.ero_api.auxiliar.enums.TipoTelefoneDoSistema;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.support.IntegracaoTest;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

class TenantIntegracaoTest extends IntegracaoTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void soSuperadminGerenciaContratantes() {
        Contratante c = novoContratante();
        assertThat(status(get("/api/tenants", c.admin().token()))).isEqualTo(403);
        assertThat(status(get("/api/tenants", loginSuperadmin().token()))).isEqualTo(200);
    }

    @Test
    void superadminAcessaContratanteESai() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao s = loginSuperadmin();

        // Na visão de plataforma não cria usuário em contratante nenhum.
        assertThat(status(post("/api/usuarios", s.token(), Map.of(
                "nome", "Teste Plataforma", "email", unico("p") + "@teste.local", "senha", SENHA_FORTE, "papel", "USUARIO"))))
                .isEqualTo(422);

        MvcTestResult acessar = post("/api/auth/superadmin/acessar/" + c.id(), s.token(), Map.of());
        assertThat(status(acessar)).isEqualTo(200);
        JsonNode a = corpo(acessar);
        String tokenNoContratante = a.path("tokenAcesso").asString();
        assertThat(a.path("usuario").path("superadminAtuando").asBoolean()).isTrue();
        assertThat(a.path("usuario").path("tenantId").asString()).isEqualTo(c.id().toString());

        assertThat(status(get("/api/usuarios/" + u.id(), tokenNoContratante))).isEqualTo(200);
        assertThat(status(get("/api/usuarios/" + u.id(), s.token()))).as("token antigo deixou de valer").isEqualTo(401);

        MvcTestResult sair = post("/api/auth/superadmin/sair", tokenNoContratante, Map.of());
        assertThat(status(sair)).isEqualTo(200);
        assertThat(corpo(sair).path("usuario").path("superadminAtuando").asBoolean()).isFalse();
    }

    /**
     * Lista e ficha trazem os usuários ativos de cada contratante. Dentro de um
     * contratante o filtro automático só deixaria contar os dele (os outros viriam com
     * 0), então essas leituras são da visão de plataforma, como as escritas.
     */
    @Test
    void listaEFichaSoNaVisaoDePlataformaComOsAtivosDeCadaUm() {
        Contratante x = novoContratante();
        Contratante y = novoContratante();
        novoUsuario(y.admin());
        Sessao s = loginSuperadmin();
        String nomeY = corpo(get("/api/tenants/" + y.id(), s.token())).path("nome").asString();

        String dentroDeX = corpo(post("/api/auth/superadmin/acessar/" + x.id(), s.token(), Map.of()))
                .path("tokenAcesso").asString();
        MvcTestResult lista = get("/api/tenants?busca=" + nomeY, dentroDeX);
        assertThat(status(lista)).isEqualTo(422);
        assertThat(corpo(lista).path("detail").asString()).isEqualTo("Saia do contratante para gerenciar contratantes.");
        assertThat(status(get("/api/tenants/" + y.id(), dentroDeX))).isEqualTo(422);
        assertThat(status(get("/api/tenants/" + x.id(), dentroDeX))).as("nem o próprio").isEqualTo(422);

        String naPlataforma = corpo(post("/api/auth/superadmin/sair", dentroDeX, Map.of())).path("tokenAcesso").asString();
        JsonNode naLista = corpo(get("/api/tenants?busca=" + nomeY, naPlataforma)).path("conteudo").get(0);
        assertThat(naLista.path("usuariosAtivos").asLong()).as("admin inicial + 1").isEqualTo(2);
        assertThat(corpo(get("/api/tenants/" + y.id(), naPlataforma)).path("usuariosAtivos").asLong()).isEqualTo(2);
    }

    @Test
    void contratanteInativoNaoEntra() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        assertThat(status(patch("/api/tenants/" + c.id() + "/inativar", s.token()))).isEqualTo(204);

        assertThat(status(get("/api/auth/eu", c.admin().token()))).isEqualTo(401);
        assertThat(status(tentarLogin(c.adminEmail(), SENHA_FORTE_2))).isEqualTo(401);
    }

    @Test
    void limiteDeUsuariosVemNaRespostaComOsAtivosEOAdminInicialConta() {
        Contratante c = novoContratante(3);
        novoUsuario(c.admin());
        Sessao s = loginSuperadmin();

        JsonNode t = corpo(get("/api/tenants/" + c.id(), s.token()));
        assertThat(t.path("limiteUsuarios").asInt()).isEqualTo(3);
        assertThat(t.path("usuariosAtivos").asLong()).as("admin inicial + 1, sem o superadmin").isEqualTo(2);
        assertThat(t.has("exige2fa")).isFalse();

        JsonNode naLista = corpo(get("/api/tenants?busca=" + t.path("nome").asString(), s.token())).path("conteudo").get(0);
        assertThat(naLista.path("usuariosAtivos").asLong()).isEqualTo(2);
        assertThat(naLista.path("limiteUsuarios").asInt()).isEqualTo(3);

        // O superadmin muda o limite; o evento guarda de quanto para quanto.
        MvcTestResult alterado = put("/api/tenants/" + c.id(), s.token(), Map.of(
                "nome", t.path("nome").asString(), "limiteUsuarios", 10, "version", t.path("version").asLong()));
        assertThat(status(alterado)).isEqualTo(200);
        assertThat(corpo(alterado).path("limiteUsuarios").asInt()).isEqualTo(10);
        JsonNode evento = corpo(get("/api/auditoria/eventos?tipos=TENANT_ALTERADO&tenantId=" + c.id(), s.token()))
                .path("conteudo").get(0);
        assertThat(evento.path("detalhe").asString()).isEqualTo("limite de usuários 3 -> 10");
    }

    @Test
    void validacaoRecusada() {
        Sessao s = loginSuperadmin();
        MvcTestResult r = post("/api/tenants", s.token(), Map.of("nome", "", "aparencia", Map.of("corDestaque", "roxo-neon")));
        assertThat(status(r)).isEqualTo(400);
        assertThat(corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()))
                .contains("nome", "aparencia.corDestaque", "aparencia.temaPadrao", "limiteUsuarios", "administrador");

        MvcTestResult limiteZero = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Empresa"), "limiteUsuarios", 0,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(limiteZero)).isEqualTo(400);
        assertThat(corpo(limiteZero).path("erros").get(0).path("mensagem").asString())
                .isEqualTo("Limite de usuários deve ser pelo menos 1");

        MvcTestResult cnpjInvalido = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Empresa"), "documento", "12.345.678/0001-00", "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(cnpjInvalido)).isEqualTo(422);
    }

    @Test
    void documentoDuplicadoVersaoAntigaEBuscaComMascara() {
        Sessao s = loginSuperadmin();
        String cnpj = gerarCnpj();
        String mascarado = cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "." + cnpj.substring(5, 8) + "/"
                + cnpj.substring(8, 12) + "-" + cnpj.substring(12);
        MvcTestResult criado = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Empresa"), "documento", mascarado, "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(criado)).isEqualTo(201);
        JsonNode t = corpo(criado);
        assertThat(t.path("documento").asString()).isEqualTo(cnpj);

        MvcTestResult duplicado = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Outra"), "documento", cnpj, "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(duplicado)).isEqualTo(409);
        assertThat(corpo(duplicado).path("erros").get(0).path("campo").asString())
                .as("duplicidade diz o campo").isEqualTo("documento");
        assertThat(corpo(duplicado).path("erros").get(0).path("mensagem").asString())
                .isEqualTo("Já existe um contratante com este documento.");

        assertThat(corpo(get("/api/tenants?busca=" + mascarado,
                s.token())).path("totalElementos").asLong()).isEqualTo(1);

        String id = t.path("id").asString();
        long versao = t.path("version").asLong();
        Map<String, Object> edicao = Map.of("nome", "Nome Novo", "documento", cnpj, "limiteUsuarios", LIMITE_PADRAO,
                "version", versao);
        MvcTestResult alterado = put("/api/tenants/" + id, s.token(), edicao);
        assertThat(status(alterado)).isEqualTo(200);
        assertThat(corpo(alterado).path("version").asLong()).isEqualTo(versao + 1);
        MvcTestResult versaoAntiga = put("/api/tenants/" + id, s.token(), edicao);
        assertThat(status(versaoAntiga)).as("versão antiga").isEqualTo(409);
        assertThat(corpo(versaoAntiga).has("erros")).as("409 de versão não traz erros").isFalse();

        // Outro contratante tentando ficar com o mesmo documento no PUT.
        Contratante outro = novoContratante();
        long versaoOutro = corpo(get("/api/tenants/" + outro.id(), s.token())).path("version").asLong();
        MvcTestResult duplicadoNoPut = put("/api/tenants/" + outro.id(), s.token(), Map.of(
                "nome", unico("Outra"), "documento", mascarado, "limiteUsuarios", LIMITE_PADRAO, "version", versaoOutro));
        assertThat(status(duplicadoNoPut)).isEqualTo(409);
        assertThat(corpo(duplicadoNoPut).path("erros").get(0).path("campo").asString()).isEqualTo("documento");
    }

    /** E-mail do administrador inicial já usado: 409 apontando o campo aninhado do TenantCreateDto. */
    @Test
    void emailDoAdministradorEmUsoApontaOCampo() {
        Contratante existente = novoContratante();
        Sessao s = loginSuperadmin();
        String nome = unico("Empresa");
        MvcTestResult r = post("/api/tenants", s.token(), Map.of(
                "nome", nome, "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", existente.adminEmail(), "senha", SENHA_FORTE)));
        assertThat(status(r)).isEqualTo(409);
        assertThat(corpo(r).path("codigo").asString()).isEqualTo("CONFLITO");
        assertThat(corpo(r).path("erros").get(0).path("campo").asString()).isEqualTo("administrador.email");
        assertThat(corpo(r).path("erros").get(0).path("mensagem").asString()).isEqualTo("Este e-mail já está em uso.");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM tenant WHERE nome = ?", Long.class, nome))
                .as("o contratante não fica sem administrador").isZero();
    }

    @Test
    void aceitaCnpjAlfanumericoERecusaTextoQueNaoEDocumento() {
        Sessao s = loginSuperadmin();
        // Exemplo do novo formato da Receita (12 posições alfanuméricas + 2 dígitos).
        MvcTestResult alfa = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Alfa"), "documento", "12.abc.345/01de-35", "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(alfa)).isEqualTo(201);
        assertThat(corpo(alfa).path("documento").asString()).isEqualTo("12ABC34501DE35");

        MvcTestResult na = post("/api/tenants", s.token(), Map.of(
                "nome", unico("Sem"), "documento", "N/A", "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(na)).isEqualTo(422);
    }

    // ------------------------------------------------------------ auditoria, plataforma e acesso

    /**
     * TAuditoria da ficha: nome de quem cadastrou e de quem alterou, na ficha e na
     * lista (um SELECT de nomes por página). Contratante sem autor (como os de
     * migration) sai com os nomes vazios.
     */
    /**
     * As escritas também: dentro de um contratante o superadmin não cria, altera,
     * configura, inativa nem reativa contratante nenhum (nem o próprio). Corpos válidos,
     * para a recusa vir da regra e não da validação.
     */
    @Test
    void escritasSoNaVisaoDePlataforma() {
        Contratante x = novoContratante();
        Sessao s = loginSuperadmin();
        JsonNode antes = corpo(get("/api/tenants/" + x.id(), s.token()));
        long versao = antes.path("version").asLong();
        String rota = "/api/tenants/" + x.id();
        String nomeNovo = unico("Nao Criada");

        String dentro = corpo(post("/api/auth/superadmin/acessar/" + x.id(), s.token(), Map.of()))
                .path("tokenAcesso").asString();
        MvcTestResult criar = post("/api/tenants", dentro, Map.of(
                "nome", nomeNovo, "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Ana Lima", "email", unico("admin") + "@teste.local", "senha", SENHA_FORTE)));
        assertThat(status(criar)).as("POST").isEqualTo(422);
        assertThat(corpo(criar).path("detail").asString()).isEqualTo("Saia do contratante para gerenciar contratantes.");
        assertThat(status(put(rota, dentro, Map.of(
                "nome", "Renomeada Por Dentro", "limiteUsuarios", LIMITE_PADRAO + 1, "version", versao))))
                .as("PUT").isEqualTo(422);
        assertThat(status(put(rota + "/configuracao", dentro, Map.of(
                "aparencia", antes.path("aparencia"), "version", versao)))).as("PUT /configuracao").isEqualTo(422);
        assertThat(status(patch(rota + "/inativar", dentro))).as("PATCH inativar").isEqualTo(422);
        assertThat(status(patch(rota + "/ativar", dentro))).as("PATCH ativar").isEqualTo(422);

        String naPlataforma = corpo(post("/api/auth/superadmin/sair", dentro, Map.of())).path("tokenAcesso").asString();
        JsonNode depois = corpo(get(rota, naPlataforma));
        assertThat(depois.path("version").asLong()).as("nada mudou").isEqualTo(versao);
        assertThat(depois.path("nome").asString()).isEqualTo(antes.path("nome").asString());
        assertThat(depois.path("ativo").asBoolean()).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM tenant WHERE nome = ?", Long.class, nomeNovo)).isZero();
    }

    @Test
    void auditoriaTrazNomesDeQuemCriouEAlterou() {
        Sessao s = loginSuperadmin();
        String nome = unico("Auditada");
        String adminEmail = unico("admin") + "@teste.local";
        MvcTestResult criado = post("/api/tenants", s.token(), Map.of(
                "nome", nome, "limiteUsuarios", LIMITE_PADRAO,
                "administrador", Map.of("nome", "Ana Lima", "email", adminEmail, "senha", SENHA_FORTE)));
        assertThat(status(criado)).isEqualTo(201);
        JsonNode t = corpo(criado);
        String id = t.path("id").asString();
        assertThat(t.path("criadoPorNome").asString()).isEqualTo("Superadmin Teste");
        assertThat(t.path("createdBy").asString()).isEqualTo(s.corpo().path("usuario").path("id").asString());

        // Alterado por outra pessoa (simulado): o nome de quem alterou é resolvido à parte do de quem criou.
        String adminId = jdbc.queryForObject("SELECT id::text FROM usuario WHERE email = ?", String.class, adminEmail);
        jdbc.update("UPDATE tenant SET updated_by = ?::uuid WHERE id = ?::uuid", adminId, id);
        JsonNode ficha = corpo(get("/api/tenants/" + id, s.token()));
        assertThat(ficha.path("criadoPorNome").asString()).isEqualTo("Superadmin Teste");
        assertThat(ficha.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");
        JsonNode naLista = corpo(get("/api/tenants?busca=" + nome, s.token())).path("conteudo").get(0);
        assertThat(naLista.path("criadoPorNome").asString()).isEqualTo("Superadmin Teste");
        assertThat(naLista.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");

        MvcTestResult alterado = put("/api/tenants/" + id, s.token(), Map.of(
                "nome", nome, "limiteUsuarios", LIMITE_PADRAO + 1, "version", ficha.path("version").asLong()));
        assertThat(status(alterado)).isEqualTo(200);
        assertThat(corpo(alterado).path("alteradoPorNome").asString()).isEqualTo("Superadmin Teste");
        assertThat(corpo(alterado).path("updatedAt").asString()).isNotBlank();

        jdbc.update("UPDATE tenant SET created_by = NULL, updated_by = NULL WHERE id = ?::uuid", id);
        JsonNode semAutor = corpo(get("/api/tenants/" + id, s.token()));
        assertThat(semAutor.path("criadoPorNome").isNull()).as("como contratante de migration").isTrue();
        assertThat(semAutor.path("alteradoPorNome").isNull()).isTrue();
        JsonNode semAutorNaLista = corpo(get("/api/tenants?busca=" + nome, s.token())).path("conteudo").get(0);
        assertThat(semAutorNaLista.path("criadoPorNome").isNull()).isTrue();
    }

    /** A Plataforma (id zero) não é contratante: não se abre, inativa, reativa, altera nem configura. */
    @Test
    void naoMexeNaPlataforma() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        JsonNode existente = corpo(get("/api/tenants/" + c.id(), s.token()));
        String plataforma = "/api/tenants/" + TenantContext.ROOT;

        assertThat(status(get(plataforma, s.token()))).as("a ficha da Plataforma não abre").isEqualTo(404);
        assertThat(corpo(get("/api/tenants/selecao", s.token())).valueStream()
                .map(t -> t.path("id").asString())).doesNotContain(TenantContext.ROOT.toString());
        assertThat(status(get("/api/tenants/fundos?tenantId=" + TenantContext.ROOT, s.token()))).isEqualTo(404);
        assertThat(status(patch(plataforma + "/inativar", s.token()))).isEqualTo(404);
        assertThat(status(patch(plataforma + "/ativar", s.token()))).isEqualTo(404);
        assertThat(status(put(plataforma, s.token(), Map.of(
                "nome", "Plataforma", "limiteUsuarios", LIMITE_PADRAO, "version", 0)))).isEqualTo(404);
        assertThat(status(put(plataforma + "/configuracao", s.token(), Map.of(
                "aparencia", existente.path("aparencia"), "version", 0)))).isEqualTo(404);

        assertThat(status(get("/api/auth/eu", s.token()))).as("o superadmin continua entrando").isEqualTo(200);
        assertThat(jdbc.queryForObject("SELECT ativo FROM tenant WHERE id = ?", Boolean.class, TenantContext.ROOT)).isTrue();
    }

    /** Inativar (ou ativar) o que já está assim responde 204 sem evento novo. */
    @Test
    void inativarDuasVezesNaoDuplicaEvento() {
        Contratante c = novoContratante();
        Sessao s = loginSuperadmin();
        String rota = "/api/tenants/" + c.id();

        assertThat(status(patch(rota + "/inativar", s.token()))).isEqualTo(204);
        assertThat(status(patch(rota + "/inativar", s.token()))).as("já inativo").isEqualTo(204);
        assertThat(eventos(s, "TENANT_INATIVADO", c)).isEqualTo(1);
        assertThat(corpo(get(rota, s.token())).path("ativo").asBoolean()).isFalse();

        assertThat(status(patch(rota + "/ativar", s.token()))).isEqualTo(204);
        assertThat(status(patch(rota + "/ativar", s.token()))).as("já ativo").isEqualTo(204);
        assertThat(eventos(s, "TENANT_ATIVADO", c)).isEqualTo(1);
        assertThat(corpo(get(rota, s.token())).path("ativo").asBoolean()).isTrue();
    }

    /**
     * Duplo clique em "Inativar": a linha do contratante é travada antes de ler, então
     * o segundo pedido espera o primeiro, já o lê inativo e responde 204 sem evento.
     * Sem a trava, os dois leem ativo: sai evento em dobro ou 409 de versão.
     */
    @Test
    void inativarEmParaleloDaDuasVezes204EUmEventoSo() throws Exception {
        Sessao s = loginSuperadmin();
        for (int rodada = 0; rodada < 5; rodada++) {
            Contratante c = novoContratante();
            java.util.concurrent.CountDownLatch largada = new java.util.concurrent.CountDownLatch(1);
            java.util.concurrent.Callable<Integer> clique = () -> {
                largada.await();
                return status(patch("/api/tenants/" + c.id() + "/inativar", s.token()));
            };
            List<Integer> resultados;
            try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
                var primeiro = pool.submit(clique);
                var segundo = pool.submit(clique);
                largada.countDown();
                resultados = List.of(primeiro.get(30, TimeUnit.SECONDS), segundo.get(30, TimeUnit.SECONDS));
            }
            assertThat(resultados).as("rodada %d", rodada).containsOnly(204);
            assertThat(eventos(s, "TENANT_INATIVADO", c)).as("rodada %d", rodada).isEqualTo(1);
        }
    }

    /** ADMIN de um contratante e USUARIO com todos os grupos não chegam a nenhuma rota da plataforma. */
    @Test
    void naoSuperadminRecusadoEmTodasAsRotas() {
        Contratante a = novoContratante();
        Contratante b = novoContratante();
        UsuarioCriado u = novoUsuario(a.admin());
        liberar(a.admin().token(), u.id(), List.of(grupo("USUARIOS", "ESCREVER"), grupo("AUDITORIA", "ESCREVER")),
                Set.of("USUARIOS_LIBERAR_ACESSO"));
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        Sessao s = loginSuperadmin();
        JsonNode fichaB = corpo(get("/api/tenants/" + b.id(), s.token()));
        long versao = fichaB.path("version").asLong();

        for (String token : List.of(a.admin().token(), comum.token())) {
            String rotaB = "/api/tenants/" + b.id();
            assertThat(status(get("/api/tenants", token))).isEqualTo(403);
            assertThat(status(get("/api/tenants/selecao", token))).isEqualTo(403);
            assertThat(status(get("/api/tenants/fundos", token))).isEqualTo(403);
            assertThat(status(get(rotaB, token))).as("ficha de outro contratante").isEqualTo(403);
            assertThat(status(get("/api/tenants/" + a.id(), token))).as("nem a do próprio").isEqualTo(403);
            assertThat(status(post("/api/tenants", token, Map.of(
                    "nome", unico("Invasora"), "limiteUsuarios", LIMITE_PADRAO,
                    "administrador", Map.of("nome", "Rita Alves", "email", unico("a") + "@teste.local",
                            "senha", SENHA_FORTE))))).isEqualTo(403);
            assertThat(status(put(rotaB, token, Map.of(
                    "nome", "Tomada", "limiteUsuarios", 10000, "version", versao)))).isEqualTo(403);
            assertThat(status(put(rotaB + "/configuracao", token, Map.of(
                    "aparencia", fichaB.path("aparencia"), "version", versao)))).isEqualTo(403);
            assertThat(status(patch(rotaB + "/inativar", token))).isEqualTo(403);
            assertThat(status(patch(rotaB + "/ativar", token))).isEqualTo(403);
        }
        JsonNode depois = corpo(get("/api/tenants/" + b.id(), s.token()));
        assertThat(depois.path("version").asLong()).as("nada mudou em B").isEqualTo(versao);
        assertThat(depois.path("ativo").asBoolean()).isTrue();
    }

    @Test
    void listaRecusaBuscaLongaEOrdenacaoForaDaListaBranca() {
        Sessao s = loginSuperadmin();
        MvcTestResult longa = get("/api/tenants?busca=" + "a".repeat(101), s.token());
        assertThat(status(longa)).isEqualTo(400);
        assertThat(corpo(longa).path("erros").get(0).path("campo").asString()).isEqualTo("busca");
        assertThat(corpo(longa).path("erros").get(0).path("mensagem").asString()).isEqualTo("Busca muito longa");
        assertThat(status(get("/api/tenants?busca=" + "a".repeat(100), s.token()))).isEqualTo(200);

        MvcTestResult ordem = get("/api/tenants?sort=documento", s.token());
        assertThat(status(ordem)).isEqualTo(422);
        assertThat(corpo(ordem).path("detail").asString()).isEqualTo("Não é possível ordenar por \"documento\".");
        assertThat(status(get("/api/tenants?sort=createdAt,desc", s.token()))).isEqualTo(200);
    }

    /**
     * Contratante novo já nasce com os itens do sistema dos 7 cadastros auxiliares (5 + 4 +
     * 2 + 3 + 5 + 6 + 7), iguais aos enums: chave, nome, código 1..N e ativos. A Plataforma nunca
     * recebe nenhum.
     */
    @Test
    void contratanteNovoRecebeOsItensDoSistema() {
        Contratante c = novoContratante();
        conferirItens("tipo_cadastro", c, TipoCadastroDoSistema.values());
        conferirItens("tipo_telefone", c, TipoTelefoneDoSistema.values());
        conferirItens("tipo_email", c, TipoEmailDoSistema.values());
        conferirItens("tipo_endereco", c, TipoEnderecoDoSistema.values());
        conferirItens("tipo_rede_social", c, TipoRedeSocialDoSistema.values());
        conferirItens("estado_civil", c, EstadoCivilDoSistema.values());
        conferirItens("profissao", c, ProfissaoDoSistema.values());
        for (String tabela : List.of("tipo_cadastro", "tipo_telefone", "tipo_email", "tipo_endereco", "tipo_rede_social",
                "estado_civil", "profissao")) {
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + tabela + " WHERE tenant_id = ?", Long.class,
                    TenantContext.ROOT)).as("Plataforma sem itens em %s", tabela).isZero();
        }
    }

    /** As linhas do contratante na tabela, na ordem do código, contra o enum (chave = name(), código = ordinal + 1). */
    private void conferirItens(String tabela, Contratante c, Enum<?>[] itens) {
        List<String> gravados = jdbc.query(
                "SELECT cod_" + tabela + ", nome, chave, ativo FROM " + tabela + " WHERE tenant_id = ? ORDER BY cod_" + tabela,
                (rs, i) -> rs.getLong(1) + "|" + rs.getString(2) + "|" + rs.getString(3) + "|" + rs.getBoolean(4),
                c.id());
        List<String> esperados = java.util.Arrays.stream(itens)
                .map(e -> (e.ordinal() + 1) + "|" + rotulo(e) + "|" + e.name() + "|true")
                .toList();
        assertThat(gravados).as(tabela).containsExactlyElementsOf(esperados);
    }

    private static String rotulo(Enum<?> item) {
        return switch (item) {
            case TipoCadastroDoSistema t -> t.rotulo();
            case TipoTelefoneDoSistema t -> t.rotulo();
            case TipoEmailDoSistema t -> t.rotulo();
            case TipoEnderecoDoSistema t -> t.rotulo();
            case TipoRedeSocialDoSistema t -> t.rotulo();
            case EstadoCivilDoSistema t -> t.rotulo();
            case ProfissaoDoSistema t -> t.rotulo();
            default -> throw new IllegalArgumentException(item.toString());
        };
    }

    private long eventos(Sessao s, String tipo, Contratante c) {
        return corpo(get("/api/auditoria/eventos?tipos=" + tipo + "&tenantId=" + c.id(), s.token()))
                .path("totalElementos").asLong();
    }

    /** CNPJ válido aleatório (dígitos verificadores calculados). */
    private static String gerarCnpj() {
        java.util.Random r = new java.util.Random();
        int[] d = new int[14];
        for (int i = 0; i < 8; i++) {
            d[i] = r.nextInt(10);
        }
        d[8] = 0; d[9] = 0; d[10] = 0; d[11] = 1;
        int[] p1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] p2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        d[12] = dv(d, p1);
        d[13] = dv(d, p2);
        StringBuilder sb = new StringBuilder();
        for (int x : d) {
            sb.append(x);
        }
        return sb.toString();
    }

    private static int dv(int[] d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += d[i] * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
