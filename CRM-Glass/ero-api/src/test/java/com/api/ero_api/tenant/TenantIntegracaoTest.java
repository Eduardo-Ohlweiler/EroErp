package com.api.ero_api.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.support.IntegracaoTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

class TenantIntegracaoTest extends IntegracaoTest {

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

        assertThat(corpo(get("/api/tenants?busca=" + mascarado,
                s.token())).path("totalElementos").asLong()).isEqualTo(1);

        String id = t.path("id").asString();
        long versao = t.path("version").asLong();
        Map<String, Object> edicao = Map.of("nome", "Nome Novo", "documento", cnpj, "limiteUsuarios", LIMITE_PADRAO,
                "version", versao);
        MvcTestResult alterado = put("/api/tenants/" + id, s.token(), edicao);
        assertThat(status(alterado)).isEqualTo(200);
        assertThat(corpo(alterado).path("version").asLong()).isEqualTo(versao + 1);
        assertThat(status(put("/api/tenants/" + id, s.token(), edicao))).as("versão antiga").isEqualTo(409);
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
