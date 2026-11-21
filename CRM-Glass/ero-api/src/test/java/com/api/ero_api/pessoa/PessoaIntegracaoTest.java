package com.api.ero_api.pessoa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.api.ero_api.support.IntegracaoTest;
import jakarta.persistence.EntityManagerFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import java.util.stream.LongStream;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;

/**
 * Pessoas: os 4 obrigatórios, o código por contratante, documentos, filhas, filtros, tipos
 * auxiliares, vínculos (os dois lados, trava e versão), o combo, os dados complementares
 * (documentos, dados civis, abertura; PLANO-PESSOAS-COMPLEMENTO) e o representante legal.
 * Cada teste usa um contratante novo: CPF e código são por contratante.
 */
class PessoaIntegracaoTest extends IntegracaoTest {

    @Autowired
    private EntityManagerFactory emf;

    @Autowired
    private JdbcTemplate jdbc;

    /** Ids do contratante: itens do sistema dos auxiliares e duas cidades. */
    record Tipos(String cliente, String fornecedor, String celular, String whatsapp, String particular,
                 String residencial, String instagram, String cidade, String outraCidade) {
    }

    // ------------------------------------------------------------ obrigatórios

    @Test
    void caminhoFeliz_criaListaBuscaAlteraInativa() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String cpf = cpf();
        String nome = unico("Marina Souza");
        Map<String, Object> corpo = com(pf(nome, t),
                "cpf", mascararCpf(cpf), "rg", "12.345.678-x", "dataNascimento", "1990-05-17", "sexo", "FEMININO",
                "observacao", "  cliente antigo  ",
                "telefones", List.of(telefone(t.celular(), "11987654321", true)),
                "emails", List.of(email(t.particular(), "Marina@Exemplo.COM", true)),
                "redesSociais", List.of(rede(t.instagram(), " @marina ", "https://instagram.com/marina")),
                "enderecos", List.of(endereco(t.residencial(), t.cidade(), true)));

        MvcTestResult r = post("/api/pessoas", token, corpo);
        assertThat(status(r)).as(texto(r)).isEqualTo(201);
        JsonNode p = corpo(r);
        String id = p.path("id").asString();
        assertThat(p.path("codPessoa").asLong()).isEqualTo(1);
        assertThat(p.path("tipoPessoa").asString()).isEqualTo("FISICA");
        assertThat(p.path("cpf").asString()).as("sem máscara").isEqualTo(cpf);
        assertThat(p.path("rg").asString()).isEqualTo("12345678X");
        assertThat(p.path("dataNascimento").asString()).isEqualTo("1990-05-17");
        assertThat(p.path("sexo").asString()).isEqualTo("FEMININO");
        assertThat(p.path("cnpj").isNull()).isTrue();
        assertThat(p.path("observacao").asString()).isEqualTo("cliente antigo");
        assertThat(p.path("ativo").asBoolean()).isTrue();
        assertThat(p.path("tiposCadastro").get(0).path("chave").asString()).isEqualTo("CLIENTE");
        assertThat(p.path("telefones").get(0).path("tipo").path("chave").asString()).isEqualTo("CELULAR");
        assertThat(p.path("telefones").get(0).path("principal").asBoolean()).isTrue();
        assertThat(p.path("emails").get(0).path("email").asString()).isEqualTo("marina@exemplo.com");
        assertThat(p.path("redesSociais").get(0).path("usuario").asString()).isEqualTo("@marina");
        assertThat(p.path("enderecos").get(0).path("cidade").path("uf").asString()).isEqualTo("SP");
        assertThat(p.path("enderecos").get(0).path("cep").asString()).isEqualTo("01001000");
        assertThat(p.path("vinculos").size()).isZero();
        assertThat(p.path("criadoPorNome").asString()).isEqualTo("Ana Lima");

        JsonNode linha = item(get("/api/pessoas?busca=" + nome, token), id);
        assertThat(linha.path("documento").asString()).isEqualTo(cpf);
        assertThat(linha.path("telefonePrincipal").asString()).isEqualTo("11987654321");
        assertThat(linha.path("emailPrincipal").asString()).isEqualTo("marina@exemplo.com");
        assertThat(linha.path("cidadePrincipal").asString()).isEqualTo("São Paulo");
        assertThat(linha.path("ufPrincipal").asString()).isEqualTo("SP");
        assertThat(linha.path("tiposCadastro").get(0).path("nome").asString()).isEqualTo("Cliente");
        assertThat(linha.has("dataNascimento")).as("a lista (e a exportação) não leva nascimento").isFalse();
        assertThat(linha.has("rg")).isFalse();

        assertThat(corpo(get("/api/pessoas/" + id, token)).path("cpf").asString()).isEqualTo(cpf);

        MvcTestResult alterado = put("/api/pessoas/" + id, token, versao(com(corpo, "nome", nome + " Lima"), p));
        assertThat(status(alterado)).as(texto(alterado)).isEqualTo(200);
        JsonNode al = corpo(alterado);
        assertThat(al.path("nome").asString()).isEqualTo(nome + " Lima");
        assertThat(al.path("version").asLong()).isGreaterThan(p.path("version").asLong());
        assertThat(al.path("alteradoPorNome").asString()).isEqualTo("Ana Lima");
        assertThat(al.path("codPessoa").asLong()).isEqualTo(1);

        assertThat(status(patch("/api/pessoas/" + id + "/inativar", token))).isEqualTo(204);
        assertThat(item(get("/api/pessoas?ativo=false&busca=" + nome, token), id).path("ativo").asBoolean()).isFalse();
        assertThat(ids(get("/api/pessoas?ativo=true&busca=" + nome, token))).doesNotContain(id);
        assertThat(status(patch("/api/pessoas/" + id + "/inativar", token))).as("já inativa").isEqualTo(204);
        assertThat(status(patch("/api/pessoas/" + id + "/ativar", token))).isEqualTo(204);
        assertThat(corpo(get("/api/pessoas/" + id, token)).path("ativo").asBoolean()).isTrue();
    }

    @Test
    void validacaoRecusada() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);

        assertThat(campos(post("/api/pessoas", token, Map.of())))
                .contains("tipoPessoa", "nome", "tiposCadastroIds");
        assertThat(campos(post("/api/pessoas", token, com(pf("", t), "tiposCadastroIds", List.of()))))
                .containsExactlyInAnyOrder("nome", "tiposCadastroIds");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "nome", "N".repeat(256))))).containsExactly("nome");
        assertThat(campos(post("/api/pessoas", token,
                com(pf("X", t), "telefones", List.of(telefone(t.celular(), "1234", true))))))
                .containsExactly("telefones[0].numero");
        assertThat(campos(post("/api/pessoas", token,
                com(pf("X", t), "emails", List.of(email(t.particular(), "nao-e-email", true))))))
                .containsExactly("emails[0].email");
        assertThat(campos(post("/api/pessoas", token,
                com(pf("X", t), "redesSociais", List.of(rede(t.instagram(), null, "javascript:alert(1)"))))))
                .as("link só http/https").containsExactly("redesSociais[0].url");
        assertThat(campos(post("/api/pessoas", token,
                com(pf("X", t), "enderecos", List.of(com(endereco(t.residencial(), t.cidade(), true), "cep", "123"))))))
                .containsExactly("enderecos[0].cep");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "dataNascimento", "2999-01-01"))))
                .containsExactly("dataNascimento");
        List<Map<String, Object>> muitos = IntStream.range(0, 21)
                .mapToObj(i -> telefone(t.celular(), "1198765432" + (i % 10), false)).toList();
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "telefones", muitos)))).containsExactly("telefones");

        // Regras que só o service vê: o mesmo formato, com o campo da linha.
        MvcTestResult cpfInvalido = post("/api/pessoas", token, com(pf("X", t), "cpf", "111.111.111-11"));
        assertThat(campos(cpfInvalido)).containsExactly("cpf");
        assertThat(mensagem(cpfInvalido)).isEqualTo("CPF inválido.");
        MvcTestResult redeVazia = post("/api/pessoas", token,
                com(pf("X", t), "redesSociais", List.of(rede(t.instagram(), "  ", ""))));
        assertThat(campos(redeVazia)).containsExactly("redesSociais[0].usuario");
        assertThat(mensagem(redeVazia)).isEqualTo("Informe o usuário ou o link.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "dataNascimento", "1899-12-31"))))
                .containsExactly("dataNascimento");

        JsonNode p = criar(token, pf(unico("Valida"), t));
        assertThat(campos(put("/api/pessoas/" + p.path("id").asString(), token, pf("Sem versao", t))))
                .containsExactly("version");

        assertThat(campos(get("/api/pessoas?busca=" + "a".repeat(101), token))).containsExactly("busca");
        assertThat(campos(get("/api/pessoas?codPessoa=0", token))).containsExactly("codPessoa");
        assertThat(campos(get("/api/pessoas/selecao?busca=" + "a".repeat(101), token))).containsExactly("busca");
        assertThat(status(get("/api/pessoas?sort=cpf", token))).as("ordenação fora da lista branca").isEqualTo(422);
    }

    @Test
    void isolamentoEntreTenants() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        String tokenB = cb.admin().token();
        Tipos ta = tipos(tokenA);
        Tipos tb = tipos(tokenB);
        String cpf = cpf();
        String nome = unico("DeA");
        JsonNode deA = criar(tokenA, com(pf(nome, ta), "cpf", cpf));
        String id = deA.path("id").asString();

        assertThat(status(get("/api/pessoas/" + id, tokenB))).isEqualTo(404);
        assertThat(ids(get("/api/pessoas?busca=" + nome, tokenB))).isEmpty();
        assertThat(ids(get("/api/pessoas/selecao?busca=" + nome, tokenB))).isEmpty();
        assertThat(status(put("/api/pessoas/" + id, tokenB, versao(pf("Invasor", tb), deA)))).isEqualTo(404);
        assertThat(status(patch("/api/pessoas/" + id + "/inativar", tokenB))).isEqualTo(404);
        assertThat(status(patch("/api/pessoas/" + id + "/ativar", tokenB))).isEqualTo(404);

        // O mesmo CPF passa no outro contratante, e lá o código também começa do 1.
        JsonNode emB = criar(tokenB, com(pf(nome, tb), "cpf", mascararCpf(cpf)));
        assertThat(emB.path("codPessoa").asLong()).isEqualTo(1);

        JsonNode visto = corpo(get("/api/pessoas/" + id, tokenA));
        assertThat(visto.path("nome").asString()).isEqualTo(nome);
        assertThat(visto.path("ativo").asBoolean()).isTrue();
        assertThat(visto.path("version").asLong()).isEqualTo(deA.path("version").asLong());
    }

    @Test
    void parLerEscrever() {
        Contratante c = novoContratante();
        String admin = c.admin().token();
        Tipos t = tipos(admin);
        JsonNode p = criar(admin, pf(unico("Alvo"), t));
        String id = p.path("id").asString();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);

        assertThat(status(get("/api/pessoas", comum.token()))).as("sem o grupo").isEqualTo(403);
        assertThat(status(get("/api/pessoas/" + id, comum.token()))).isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("PESSOAS", "LER")), Set.of());
        assertThat(status(get("/api/pessoas", comum.token()))).isEqualTo(200);
        assertThat(status(get("/api/pessoas/" + id, comum.token()))).isEqualTo(200);
        assertThat(status(get("/api/pessoas/selecao", comum.token()))).isEqualTo(200);
        assertThat(status(post("/api/pessoas", comum.token(), pf(unico("Nao"), t)))).isEqualTo(403);
        assertThat(status(put("/api/pessoas/" + id, comum.token(), versao(pf(unico("Nao"), t), p)))).isEqualTo(403);
        assertThat(status(patch("/api/pessoas/" + id + "/inativar", comum.token()))).isEqualTo(403);
        assertThat(status(patch("/api/pessoas/" + id + "/ativar", comum.token()))).isEqualTo(403);

        liberar(admin, u.id(), List.of(grupo("PESSOAS", "ESCREVER")), Set.of());
        assertThat(status(post("/api/pessoas", comum.token(), pf(unico("Sim"), t)))).isEqualTo(201);

        // Na visão de plataforma o filtro de tenant não vale: nada de ler nem gravar.
        Sessao s = loginSuperadmin();
        assertThat(status(get("/api/pessoas", s.token()))).isEqualTo(422);
        assertThat(status(get("/api/pessoas/selecao", s.token()))).isEqualTo(422);
        assertThat(status(get("/api/pessoas/" + id, s.token()))).isEqualTo(422);
        assertThat(status(post("/api/pessoas", s.token(), pf(unico("Plat"), t)))).isEqualTo(422);
        assertThat(status(patch("/api/pessoas/" + id + "/inativar", s.token()))).isEqualTo(422);
    }

    /** Nome de pessoa é dado pessoal: o combo não é ACESSO_LIBERADO como o dos tipos. */
    @Test
    void selecaoExigePessoasLer403() {
        Contratante c = novoContratante();
        UsuarioCriado u = novoUsuario(c.admin());
        Sessao comum = loginTrocandoSenha(u.email(), SENHA_FORTE, SENHA_FORTE_2);
        assertThat(status(get("/api/pessoas/selecao", comum.token()))).isEqualTo(403);
        assertThat(status(get("/api/tipos-cadastro/selecao", comum.token()))).as("o dos tipos é de todos").isEqualTo(200);
    }

    // ------------------------------------------------------------ código

    @Test
    void codigo_primeiroEh1EOSeguinte2_cadaContratanteDo1() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        Tipos ta = tipos(ca.admin().token());
        assertThat(criar(ca.admin().token(), pf(unico("Um"), ta)).path("codPessoa").asLong()).isEqualTo(1);
        assertThat(criar(ca.admin().token(), pf(unico("Dois"), ta)).path("codPessoa").asLong()).isEqualTo(2);
        assertThat(criar(cb.admin().token(), pf(unico("Outro"), tipos(cb.admin().token()))).path("codPessoa").asLong())
                .isEqualTo(1);
    }

    @Test
    void codigo_ignoradoNoCorpo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode p = criar(token, com(pf(unico("Cod"), t), "codPessoa", 999, "id", UUID.randomUUID().toString()));
        assertThat(p.path("codPessoa").asLong()).isEqualTo(1);
        JsonNode al = corpo(put("/api/pessoas/" + p.path("id").asString(), token,
                versao(com(pf(unico("Cod"), t), "codPessoa", 777), p)));
        assertThat(al.path("codPessoa").asLong()).isEqualTo(1);
    }

    @Test
    void codigo_filtroNaoAchaOutroContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        Tipos ta = tipos(ca.admin().token());
        criar(ca.admin().token(), pf(unico("A1"), ta));
        criar(ca.admin().token(), pf(unico("A2"), ta));
        String deB = criar(cb.admin().token(), pf(unico("B1"), tipos(cb.admin().token()))).path("id").asString();

        assertThat(ids(get("/api/pessoas?codPessoa=2", cb.admin().token()))).isEmpty();
        assertThat(ids(get("/api/pessoas?codPessoa=1", cb.admin().token()))).containsExactly(deB);
    }

    /**
     * Dois cadastros ao mesmo tempo leem o mesmo maior + 1; o índice único recusa o
     * segundo e o {@code RepetirSeCodigoRepetido} tenta de novo numa transação nova.
     */
    @Test
    void codigo_doisCriarSimultaneosSem409() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        List<Long> codigos = new ArrayList<>();
        for (int rodada = 0; rodada < 8; rodada++) {
            CountDownLatch largada = new CountDownLatch(1);
            Callable<MvcTestResult> cadastro = () -> {
                largada.await();
                return post("/api/pessoas", token, com(pf(unico("Par"), t), "cpf", cpf()));
            };
            List<MvcTestResult> resultados = emParalelo(largada, cadastro, cadastro);
            for (MvcTestResult r : resultados) {
                assertThat(status(r)).as("rodada %d: %s", rodada, texto(r)).isEqualTo(201);
                codigos.add(corpo(r).path("codPessoa").asLong());
            }
        }
        assertThat(codigos).as("sem buraco nem repetição")
                .containsExactlyInAnyOrderElementsOf(LongStream.rangeClosed(1, 16).boxed().toList());
    }

    // ------------------------------------------------------------ documentos e campos

    @Test
    void cpfDuplicado409ComCampoECodigo() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String cpf = cpf();
        criar(token, com(pf(unico("Primeira"), t), "cpf", cpf));

        MvcTestResult repetido = post("/api/pessoas", token, com(pf(unico("Segunda"), t), "cpf", mascararCpf(cpf)));
        assertThat(status(repetido)).isEqualTo(409);
        assertThat(campos(repetido)).containsExactly("cpf");
        assertThat(mensagem(repetido)).isEqualTo("CPF já cadastrado (código 1).");

        JsonNode outra = criar(token, com(pf(unico("Terceira"), t), "cpf", cpf()));
        MvcTestResult noPut = put("/api/pessoas/" + outra.path("id").asString(), token,
                versao(com(pf(unico("Terceira"), t), "cpf", cpf), outra));
        assertThat(status(noPut)).isEqualTo(409);
        assertThat(campos(noPut)).containsExactly("cpf");
    }

    @Test
    void cnpjDuplicado409() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        // CNPJ alfanumérico (exemplo da Receita), digitado com máscara e em minúsculas.
        JsonNode empresa = criar(token, com(pj(unico("Empresa"), t), "cnpj", "12.abc.345/01de-35"));
        assertThat(empresa.path("cnpj").asString()).isEqualTo("12ABC34501DE35");

        MvcTestResult repetido = post("/api/pessoas", token, com(pj(unico("Outra"), t), "cnpj", "12ABC34501DE35"));
        assertThat(status(repetido)).isEqualTo(409);
        assertThat(campos(repetido)).containsExactly("cnpj");
        assertThat(mensagem(repetido)).isEqualTo("CNPJ já cadastrado (código 1).");

        MvcTestResult invalido = post("/api/pessoas", token, com(pj(unico("Errada"), t), "cnpj", "11.222.333/0001-82"));
        assertThat(campos(invalido)).containsExactly("cnpj");
        assertThat(mensagem(invalido)).isEqualTo("CNPJ inválido.");
    }

    @Test
    void campoDoTipoErrado400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);

        MvcTestResult cnpjNaFisica = post("/api/pessoas", token, com(pf("X", t), "cnpj", cnpj()));
        assertThat(campos(cnpjNaFisica)).containsExactly("cnpj");
        assertThat(mensagem(cnpjNaFisica)).isEqualTo("Pessoa física não tem CNPJ.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "nomeFantasia", "Loja")))).containsExactly("nomeFantasia");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "inscricaoEstadual", "123456"))))
                .containsExactly("inscricaoEstadual");

        MvcTestResult cpfNaJuridica = post("/api/pessoas", token, com(pj("X", t), "cpf", cpf()));
        assertThat(campos(cpfNaJuridica)).containsExactly("cpf");
        assertThat(mensagem(cpfNaJuridica)).isEqualTo("Pessoa jurídica não tem CPF.");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "dataNascimento", "1990-01-01"))))
                .containsExactly("dataNascimento");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "sexo", "MASCULINO")))).containsExactly("sexo");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "rg", "1234567")))).containsExactly("rg");

        assertThat(status(post("/api/pessoas", token, com(pf(unico("Vazio"), t), "cnpj", "", "nomeFantasia", "  "))))
                .as("vazio conta como não informado").isEqualTo(201);
    }

    @Test
    void trocaDeTipoLimpaOsCamposAnteriores() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode fisica = criar(token, com(pf(unico("Troca"), t),
                "cpf", cpf(), "rg", "1234567", "dataNascimento", "1980-02-03", "sexo", "MASCULINO"));
        String id = fisica.path("id").asString();

        JsonNode juridica = corpo(put("/api/pessoas/" + id, token, versao(com(pj(unico("Troca SA"), t),
                "cnpj", cnpj(), "nomeFantasia", "Troca", "inscricaoEstadual", "123.456.789", "inscricaoMunicipal", "98765"),
                fisica)));
        assertThat(juridica.path("tipoPessoa").asString()).isEqualTo("JURIDICA");
        assertThat(juridica.path("cpf").isNull()).isTrue();
        assertThat(juridica.path("rg").isNull()).isTrue();
        assertThat(juridica.path("dataNascimento").isNull()).isTrue();
        assertThat(juridica.path("sexo").isNull()).isTrue();
        assertThat(juridica.path("inscricaoEstadual").asString()).isEqualTo("123456789");
        assertThat(juridica.path("nomeFantasia").asString()).isEqualTo("Troca");

        JsonNode deVolta = corpo(put("/api/pessoas/" + id, token, versao(pf(unico("Troca"), t), juridica)));
        assertThat(deVolta.path("tipoPessoa").asString()).isEqualTo("FISICA");
        assertThat(deVolta.path("cnpj").isNull()).isTrue();
        assertThat(deVolta.path("nomeFantasia").isNull()).isTrue();
        assertThat(deVolta.path("inscricaoEstadual").isNull()).isTrue();
        assertThat(deVolta.path("inscricaoMunicipal").isNull()).isTrue();
    }

    @Test
    void rgIeImForaDoTamanho400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);

        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "rg", "12345")))).containsExactly("rg");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "rg", "12345678901")))).containsExactly("rg");
        assertThat(criar(token, com(pf(unico("Rg"), t), "rg", "12.345-6")).path("rg").asString()).isEqualTo("123456");

        MvcTestResult ieCurta = post("/api/pessoas", token, com(pj("X", t), "inscricaoEstadual", "1234"));
        assertThat(campos(ieCurta)).containsExactly("inscricaoEstadual");
        assertThat(mensagem(ieCurta)).isEqualTo("Inscrição estadual deve ter de 5 a 12 dígitos.");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "inscricaoEstadual", "1234567890123"))))
                .containsExactly("inscricaoEstadual");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "inscricaoEstadual", "ISENTO"))))
                .containsExactly("inscricaoEstadual");
        assertThat(campos(post("/api/pessoas", token, com(pj("X", t), "inscricaoMunicipal", "12-34"))))
                .containsExactly("inscricaoMunicipal");
        assertThat(status(post("/api/pessoas", token, com(pj(unico("Im"), t), "inscricaoMunicipal", "12345"))))
                .isEqualTo(201);
    }

    // ------------------------------------------------------------ filhas e versão

    @Test
    void doisPrincipais400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);

        MvcTestResult telefones = post("/api/pessoas", token, com(pf("X", t), "telefones",
                List.of(telefone(t.celular(), "11987654321", true), telefone(t.whatsapp(), "11912345678", true))));
        assertThat(campos(telefones)).containsExactly("telefones");
        assertThat(mensagem(telefones)).isEqualTo("Marque só um telefone principal.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "emails",
                List.of(email(t.particular(), "a@x.com", true), email(t.particular(), "b@x.com", true))))))
                .containsExactly("emails");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "enderecos",
                List.of(endereco(t.residencial(), t.cidade(), true), endereco(t.residencial(), t.outraCidade(), true))))))
                .containsExactly("enderecos");
    }

    @Test
    void nenhumPrincipalOPrimeiroVira() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode p = criar(token, com(pf(unico("Sem principal"), t),
                "telefones", List.of(telefone(t.celular(), "11987654321", false), telefone(t.whatsapp(), "11912345678", false)),
                "emails", List.of(email(t.particular(), "a@x.com", false), email(t.particular(), "b@x.com", false)),
                "enderecos", List.of(endereco(t.residencial(), t.cidade(), false),
                        endereco(t.residencial(), t.outraCidade(), false))));
        assertThat(principais(p.path("telefones"))).containsExactly(true, false);
        assertThat(principais(p.path("emails"))).containsExactly(true, false);
        assertThat(principais(p.path("enderecos"))).containsExactly(true, false);

        JsonNode segundo = criar(token, com(pf(unico("Segundo principal"), t), "telefones",
                List.of(telefone(t.celular(), "11987654321", false), telefone(t.whatsapp(), "11912345678", true))));
        assertThat(principais(segundo.path("telefones"))).containsExactly(false, true);
    }

    @Test
    void listaEhOEstadoCompleto() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Map<String, Object> corpo = pf(unico("Lista"), t);
        JsonNode p = criar(token, com(corpo,
                "tiposCadastroIds", List.of(t.cliente(), t.fornecedor()),
                "telefones", List.of(telefone(t.celular(), "11911111111", true), telefone(t.celular(), "11922222222", false)),
                "emails", List.of(email(t.particular(), "a@x.com", true))));
        String id = p.path("id").asString();

        JsonNode al = corpo(put("/api/pessoas/" + id, token, versao(com(corpo,
                "tiposCadastroIds", List.of(t.fornecedor()),
                "telefones", List.of(telefone(t.whatsapp(), "11933333333", false),
                        telefone(t.celular(), "11944444444", true), telefone(t.celular(), "1155555555", false))), p)));
        assertThat(al.path("telefones").valueStream().map(n -> n.path("numero").asString()))
                .as("na ordem da lista").containsExactly("11933333333", "11944444444", "1155555555");
        assertThat(principais(al.path("telefones"))).containsExactly(false, true, false);
        assertThat(al.path("emails").size()).as("lista vazia apaga").isZero();
        assertThat(al.path("tiposCadastro").valueStream().map(n -> n.path("chave").asString())).containsExactly("FORNECEDOR");

        JsonNode relido = corpo(get("/api/pessoas/" + id, token));
        assertThat(relido.path("telefones").size()).isEqualTo(3);
        assertThat(relido.path("emails").size()).isZero();
    }

    @Test
    void versaoSobeQuandoSoUmTelefoneMuda() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Map<String, Object> corpo = com(pf(unico("Versao"), t), "telefones",
                List.of(telefone(t.celular(), "11911111111", true)));
        JsonNode p = criar(token, corpo);
        String id = p.path("id").asString();

        JsonNode al = corpo(put("/api/pessoas/" + id, token, versao(com(corpo, "telefones",
                List.of(telefone(t.celular(), "11922222222", true))), p)));
        assertThat(al.path("version").asLong()).isGreaterThan(p.path("version").asLong());
        assertThat(al.path("updatedAt").isNull()).isFalse();

        MvcTestResult velha = put("/api/pessoas/" + id, token, versao(corpo, p));
        assertThat(status(velha)).isEqualTo(409);
        assertThat(corpo(velha).has("erros")).as("409 de versão sai sem erros: recarregar").isFalse();
    }

    @Test
    void cidadeInexistente400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "enderecos", List.of(
                endereco(t.residencial(), t.cidade(), true),
                endereco(t.residencial(), UUID.randomUUID().toString(), false))));
        assertThat(campos(r)).containsExactly("enderecos[1].cidadeId");
        assertThat(mensagem(r)).isEqualTo("Cidade não encontrada.");
    }

    // ------------------------------------------------------------ busca e filtros

    @Test
    void buscaSemAcento() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String sufixo = unico("x");
        String jose = criar(token, pf("José Ávila " + sufixo, t)).path("id").asString();
        String padaria = criar(token, com(pj("Comércio de Pães " + sufixo + " Ltda", t), "nomeFantasia", "Padaria São João"))
                .path("id").asString();

        assertThat(ids(get("/api/pessoas?busca=jose avila " + sufixo, token))).containsExactly(jose);
        assertThat(ids(get("/api/pessoas?busca=JOSÉ ÁVILA " + sufixo.toUpperCase(), token))).containsExactly(jose);
        assertThat(ids(get("/api/pessoas?busca=sao joao", token))).as("acha pela fantasia").containsExactly(padaria);
        assertThat(ids(get("/api/pessoas?busca=paes " + sufixo, token))).containsExactly(padaria);
    }

    @Test
    void filtroDocumentoComMascaraEParcial() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String cpf = cpf();
        String cnpj = cnpj();
        String pessoa = criar(token, com(pf(unico("Doc"), t), "cpf", cpf)).path("id").asString();
        String empresa = criar(token, com(pj(unico("Doc SA"), t), "cnpj", cnpj)).path("id").asString();

        assertThat(ids(get("/api/pessoas?documento=" + mascararCpf(cpf), token))).containsExactly(pessoa);
        assertThat(ids(get("/api/pessoas?documento=" + cpf.substring(0, 3) + "." + cpf.substring(3, 6), token)))
                .contains(pessoa);
        assertThat(ids(get("/api/pessoas?documento=" + cnpj.substring(0, 2) + "." + cnpj.substring(2, 5) + "."
                + cnpj.substring(5, 8) + "/" + cnpj.substring(8, 12), token))).containsExactly(empresa);
        assertThat(ids(get("/api/pessoas?documento=...", token))).as("só máscara = sem filtro").contains(pessoa, empresa);
    }

    @Test
    void filtroTipoCadastro() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String cliente = criar(token, pf(unico("Cli"), t)).path("id").asString();
        String fornecedor = criar(token, com(pj(unico("For"), t), "tiposCadastroIds", List.of(t.fornecedor())))
                .path("id").asString();
        String os2 = criar(token, com(pf(unico("Ambos"), t), "tiposCadastroIds", List.of(t.cliente(), t.fornecedor())))
                .path("id").asString();

        assertThat(ids(get("/api/pessoas?tipoCadastroId=" + t.cliente(), token)))
                .containsExactlyInAnyOrder(cliente, os2);
        assertThat(ids(get("/api/pessoas?tipoCadastroId=" + t.fornecedor(), token)))
                .containsExactlyInAnyOrder(fornecedor, os2);
        assertThat(ids(get("/api/pessoas", token))).as("parâmetro nulo = todos").containsExactlyInAnyOrder(cliente, fornecedor, os2);
        assertThat(ids(get("/api/pessoas?tipoCadastroId=", token))).as("parâmetro vazio = todos").hasSize(3);
        assertThat(ids(get("/api/pessoas?tipoPessoa=JURIDICA", token))).containsExactly(fornecedor);
        assertThat(ids(get("/api/pessoas?tipoPessoa=FISICA&tipoCadastroId=" + t.fornecedor(), token))).containsExactly(os2);
    }

    /** A lista não cai em N+1: o número de comandos é o mesmo com 2 ou 4 pessoas por página (no máximo 6). */
    @Test
    void listaSemNMais1() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String prefixo = unico("Lote");
        for (int i = 0; i < 5; i++) {
            criar(token, com(pf(prefixo + " " + i, t),
                    "tiposCadastroIds", List.of(t.cliente(), t.fornecedor()),
                    "telefones", List.of(telefone(t.celular(), "1198765432" + i, true)),
                    "emails", List.of(email(t.particular(), "p" + i + "@x.com", true)),
                    "enderecos", List.of(endereco(t.residencial(), t.cidade(), true))));
        }
        Statistics estatisticas = emf.unwrap(SessionFactory.class).getStatistics();
        boolean ligadas = estatisticas.isStatisticsEnabled();
        estatisticas.setStatisticsEnabled(true);
        try {
            assertThat(status(get("/api/pessoas?size=2&busca=" + prefixo, token))).isEqualTo(200);
            long comDuas = comandos(estatisticas, "/api/pessoas?size=2&busca=" + prefixo, token, 2);
            long comQuatro = comandos(estatisticas, "/api/pessoas?size=4&busca=" + prefixo, token, 4);
            assertThat(comQuatro).as("mesmo número de comandos com mais linhas").isEqualTo(comDuas);
            assertThat(comQuatro).as("página, contagem, tipos e os 3 principais").isLessThanOrEqualTo(6);
        } finally {
            estatisticas.setStatisticsEnabled(ligadas);
        }
    }

    // ------------------------------------------------------------ tipos auxiliares

    @Test
    void tipoDeOutroContratante400() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        Tipos ta = tipos(tokenA);
        Tipos tb = tipos(cb.admin().token());
        String proprioDeB = corpo(post("/api/tipos-telefone", cb.admin().token(), Map.of("nome", unico("Rádio"))))
                .path("id").asString();

        MvcTestResult cadastro = post("/api/pessoas", tokenA, com(pf("X", ta), "tiposCadastroIds", List.of(tb.cliente())));
        assertThat(campos(cadastro)).containsExactly("tiposCadastroIds");
        assertThat(mensagem(cadastro)).isEqualTo("Tipo de cadastro não encontrado.");

        for (String tipoDeB : List.of(tb.celular(), proprioDeB)) {
            MvcTestResult telefone = post("/api/pessoas", tokenA, com(pf("X", ta), "telefones",
                    List.of(telefone(ta.celular(), "11911111111", true), telefone(tipoDeB, "11922222222", false))));
            assertThat(campos(telefone)).containsExactly("telefones[1].tipoId");
            assertThat(mensagem(telefone)).isEqualTo("Tipo de telefone não encontrado.");
        }
        assertThat(campos(post("/api/pessoas", tokenA, com(pf("X", ta), "enderecos",
                List.of(endereco(tb.residencial(), ta.cidade(), true)))))).containsExactly("enderecos[0].tipoId");
    }

    @Test
    void tipoInativoNovo400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String tipoTelefone = tipoInativo(token, "/api/tipos-telefone");
        String tipoCadastro = tipoInativo(token, "/api/tipos-cadastro");

        MvcTestResult telefone = post("/api/pessoas", token, com(pf("X", t), "telefones",
                List.of(telefone(tipoTelefone, "11911111111", true))));
        assertThat(campos(telefone)).containsExactly("telefones[0].tipoId");
        assertThat(mensagem(telefone)).isEqualTo("Tipo de telefone inativo.");
        MvcTestResult cadastro = post("/api/pessoas", token, com(pf("X", t), "tiposCadastroIds", List.of(tipoCadastro)));
        assertThat(campos(cadastro)).containsExactly("tiposCadastroIds");
        assertThat(mensagem(cadastro)).isEqualTo("Tipo de cadastro inativo.");
    }

    @Test
    void tipoInativoJaGravadoContinuaAceito() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String tipoTelefone = corpo(post("/api/tipos-telefone", token, Map.of("nome", unico("Bip")))).path("id").asString();
        String tipoCadastro = corpo(post("/api/tipos-cadastro", token, Map.of("nome", unico("Sócio")))).path("id").asString();
        Map<String, Object> corpo = com(pf(unico("Antiga"), t), "tiposCadastroIds", List.of(tipoCadastro),
                "telefones", List.of(telefone(tipoTelefone, "11911111111", true)));
        JsonNode p = criar(token, corpo);
        assertThat(status(patch("/api/tipos-telefone/" + tipoTelefone + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch("/api/tipos-cadastro/" + tipoCadastro + "/inativar", token))).isEqualTo(204);

        JsonNode ficha = corpo(get("/api/pessoas/" + p.path("id").asString(), token));
        assertThat(ficha.path("telefones").get(0).path("tipo").path("ativo").asBoolean()).as("aparece como inativo").isFalse();
        assertThat(ficha.path("tiposCadastro").get(0).path("ativo").asBoolean()).isFalse();

        MvcTestResult mesmaPessoa = put("/api/pessoas/" + p.path("id").asString(), token,
                versao(com(corpo, "observacao", "mudou"), ficha));
        assertThat(status(mesmaPessoa)).as(texto(mesmaPessoa)).isEqualTo(200);

        MvcTestResult outraPessoa = post("/api/pessoas", token, com(pf("Nova", t), "telefones",
                List.of(telefone(tipoTelefone, "11911111111", true))));
        assertThat(mensagem(outraPessoa)).isEqualTo("Tipo de telefone inativo.");
    }

    // ------------------------------------------------------------ vínculos

    /** As duas orientações da linha: A < B (gravado como veio) e C > A (gravado invertido). */
    @Test
    void vinculoApareceNosDoisLados() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode a = criar(token, pf(unico("Pai"), t));
        JsonNode b = criar(token, pf(unico("Filho"), t));
        String idA = a.path("id").asString();
        String idB = b.path("id").asString();

        JsonNode al = corpo(put("/api/pessoas/" + idA, token, versao(com(pf(a.path("nome").asString(), t),
                "vinculos", List.of(vinculo(idB, "DEPENDENTE", "  mora junto "))), a)));
        assertThat(al.path("vinculos").get(0).path("pessoa").path("id").asString()).isEqualTo(idB);
        assertThat(al.path("vinculos").get(0).path("tipo").asString()).isEqualTo("DEPENDENTE");
        assertThat(al.path("vinculos").get(0).path("observacao").asString()).isEqualTo("mora junto");

        JsonNode vistoDeB = corpo(get("/api/pessoas/" + idB, token)).path("vinculos").get(0);
        assertThat(vistoDeB.path("pessoa").path("id").asString()).isEqualTo(idA);
        assertThat(vistoDeB.path("pessoa").path("codPessoa").asLong()).isEqualTo(a.path("codPessoa").asLong());
        assertThat(vistoDeB.path("tipo").asString()).isEqualTo("RESPONSAVEL");
        assertThat(vistoDeB.path("pessoaAtiva").asBoolean()).isTrue();
        assertThat(vistoDeB.path("observacao").asString()).isEqualTo("mora junto");

        // C (criada depois) diz que A é o responsável dela; A passa a ver C como dependente.
        JsonNode filhaC = criar(token, com(pf(unico("Filha"), t), "vinculos", List.of(vinculo(idA, "RESPONSAVEL", null))));
        JsonNode vistoDeA = corpo(get("/api/pessoas/" + idA, token));
        assertThat(vistoDeA.path("vinculos").valueStream()
                .filter(v -> v.path("pessoa").path("id").asString().equals(filhaC.path("id").asString()))
                .findFirst().orElseThrow().path("tipo").asString()).isEqualTo("DEPENDENTE");
        assertThat(vistoDeA.path("vinculos").size()).isEqualTo(2);
    }

    @Test
    void vinculoRecusado400() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String token = ca.admin().token();
        Tipos t = tipos(token);
        JsonNode a = criar(token, pf(unico("A"), t));
        String idA = a.path("id").asString();
        String idB = criar(token, pf(unico("B"), t)).path("id").asString();
        String inativa = criar(token, pf(unico("Inativa"), t)).path("id").asString();
        assertThat(status(patch("/api/pessoas/" + inativa + "/inativar", token))).isEqualTo(204);
        String deOutroContratante = criar(cb.admin().token(), pf(unico("Alheia"), tipos(cb.admin().token())))
                .path("id").asString();

        MvcTestResult consigo = put("/api/pessoas/" + idA, token,
                versao(com(pf("A", t), "vinculos", List.of(vinculo(idA, "FAMILIAR", null))), a));
        assertThat(campos(consigo)).containsExactly("vinculos[0].pessoaId");
        assertThat(mensagem(consigo)).isEqualTo("Uma pessoa não pode ser vinculada a ela mesma.");

        MvcTestResult repetida = post("/api/pessoas", token, com(pf("X", t),
                "vinculos", List.of(vinculo(idB, "FAMILIAR", null), vinculo(idB, "CONJUGE", null))));
        assertThat(campos(repetida)).containsExactly("vinculos[1].pessoaId");
        assertThat(mensagem(repetida)).isEqualTo("Esta pessoa já está na lista.");

        for (String naoExiste : List.of(deOutroContratante, UUID.randomUUID().toString())) {
            MvcTestResult alheia = post("/api/pessoas", token, com(pf("X", t), "vinculos", List.of(vinculo(naoExiste, "FAMILIAR", null))));
            assertThat(campos(alheia)).containsExactly("vinculos[0].pessoaId");
            assertThat(mensagem(alheia)).isEqualTo("Pessoa não encontrada.");
        }
        assertThat(corpo(get("/api/pessoas/" + deOutroContratante, cb.admin().token())).path("vinculos").size())
                .as("nada gravado do outro lado").isZero();

        MvcTestResult comInativa = post("/api/pessoas", token, com(pf("X", t), "vinculos", List.of(vinculo(inativa, "FAMILIAR", null))));
        assertThat(campos(comInativa)).containsExactly("vinculos[0].pessoaId");
        assertThat(mensagem(comInativa)).isEqualTo("Esta pessoa está inativa.");
    }

    @Test
    void vinculoComInativaJaGravadaContinua() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String idB = criar(token, pf(unico("B"), t)).path("id").asString();
        Map<String, Object> corpo = com(pf(unico("A"), t), "vinculos", List.of(vinculo(idB, "CONJUGE", null)));
        JsonNode a = criar(token, corpo);
        assertThat(status(patch("/api/pessoas/" + idB + "/inativar", token))).isEqualTo(204);

        JsonNode ficha = corpo(get("/api/pessoas/" + a.path("id").asString(), token));
        assertThat(ficha.path("vinculos").get(0).path("pessoaAtiva").asBoolean()).isFalse();
        MvcTestResult r = put("/api/pessoas/" + a.path("id").asString(), token, versao(com(corpo, "observacao", "x"), ficha));
        assertThat(status(r)).as(texto(r)).isEqualTo(200);
        assertThat(ids(get("/api/pessoas/selecao?busca=" + corpo(get("/api/pessoas/" + idB, token)).path("nome").asString(), token)))
                .as("inativa não aparece no combo").isEmpty();
    }

    @Test
    void vinculoEmpresaPrecisaSerPJ400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String empresa = criar(token, pj(unico("Empresa SA"), t)).path("id").asString();
        String fisica = criar(token, pf(unico("Fulano"), t)).path("id").asString();

        JsonNode contato = criar(token, com(pf(unico("Contato"), t), "vinculos", List.of(vinculo(empresa, "EMPRESA", null))));
        JsonNode vistoDaEmpresa = corpo(get("/api/pessoas/" + empresa, token)).path("vinculos").get(0);
        assertThat(vistoDaEmpresa.path("pessoa").path("id").asString()).isEqualTo(contato.path("id").asString());
        assertThat(vistoDaEmpresa.path("tipo").asString()).isEqualTo("CONTATO");

        MvcTestResult empresaPf = post("/api/pessoas", token, com(pf("X", t), "vinculos", List.of(vinculo(fisica, "EMPRESA", null))));
        assertThat(campos(empresaPf)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(empresaPf)).isEqualTo("A empresa precisa ser pessoa jurídica.");

        MvcTestResult contatoDePf = post("/api/pessoas", token, com(pf("X", t), "vinculos", List.of(vinculo(fisica, "CONTATO", null))));
        assertThat(campos(contatoDePf)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(contatoDePf)).isEqualTo("Só pessoa jurídica tem contato.");

        assertThat(status(post("/api/pessoas", token, com(pj(unico("Outra SA"), t), "vinculos",
                List.of(vinculo(fisica, "CONTATO", null)))))).as("PJ tem contato").isEqualTo(201);
    }

    @Test
    void removerPeloOutroLadoSomeNosDois() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String idB = criar(token, pf(unico("B"), t)).path("id").asString();
        JsonNode a = criar(token, com(pf(unico("A"), t), "vinculos", List.of(vinculo(idB, "FAMILIAR", null))));

        JsonNode b = corpo(get("/api/pessoas/" + idB, token));
        assertThat(b.path("vinculos").size()).isEqualTo(1);
        MvcTestResult semVinculo = put("/api/pessoas/" + idB, token, versao(pf(b.path("nome").asString(), t), b));
        assertThat(status(semVinculo)).as(texto(semVinculo)).isEqualTo(200);

        assertThat(corpo(get("/api/pessoas/" + a.path("id").asString(), token)).path("vinculos").size()).isZero();
        assertThat(corpo(get("/api/pessoas/" + idB, token)).path("vinculos").size()).isZero();
    }

    /** A ficha de B aberta antes de A salvar o vínculo: o PUT de B recebe 409 em vez de apagar o vínculo. */
    @Test
    void versaoDoOutroLadoSobe() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode a = criar(token, pf(unico("A"), t));
        JsonNode b = criar(token, pf(unico("B"), t));
        String idB = b.path("id").asString();

        assertThat(status(put("/api/pessoas/" + a.path("id").asString(), token, versao(com(pf(a.path("nome").asString(), t),
                "vinculos", List.of(vinculo(idB, "CONJUGE", null))), a)))).isEqualTo(200);

        MvcTestResult velha = put("/api/pessoas/" + idB, token, versao(pf(b.path("nome").asString(), t), b));
        assertThat(status(velha)).isEqualTo(409);
        JsonNode relida = corpo(get("/api/pessoas/" + idB, token));
        assertThat(relida.path("version").asLong()).isGreaterThan(b.path("version").asLong());
        assertThat(relida.path("vinculos").size()).as("o vínculo não sumiu").isEqualTo(1);

        // Mudar só o tipo pelo outro lado também sobe a versão de quem estava aberto.
        JsonNode aAtual = corpo(get("/api/pessoas/" + a.path("id").asString(), token));
        assertThat(status(put("/api/pessoas/" + idB, token, versao(com(pf(b.path("nome").asString(), t),
                "vinculos", List.of(vinculo(a.path("id").asString(), "FAMILIAR", null))), relida)))).isEqualTo(200);
        assertThat(status(put("/api/pessoas/" + a.path("id").asString(), token,
                versao(pf(a.path("nome").asString(), t), aAtual)))).isEqualTo(409);
    }

    /**
     * A e B salvando ao mesmo tempo, cada um pondo o outro no vínculo: as duas pontas são
     * travadas na mesma ordem, então um termina 200 e o outro 200 ou 409, nunca deadlock nem 500.
     */
    @Test
    void doisSalvandoAoMesmoTempoAeBSemErro500() throws Exception {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        for (int rodada = 0; rodada < 6; rodada++) {
            JsonNode a = criar(token, pf(unico("A"), t));
            JsonNode b = criar(token, pf(unico("B"), t));
            String idA = a.path("id").asString();
            String idB = b.path("id").asString();
            CountDownLatch largada = new CountDownLatch(1);
            Callable<MvcTestResult> salvaA = () -> {
                largada.await();
                return put("/api/pessoas/" + idA, token, versao(com(pf(a.path("nome").asString(), t),
                        "vinculos", List.of(vinculo(idB, "DEPENDENTE", null))), a));
            };
            Callable<MvcTestResult> salvaB = () -> {
                largada.await();
                return put("/api/pessoas/" + idB, token, versao(com(pf(b.path("nome").asString(), t),
                        "vinculos", List.of(vinculo(idA, "CONJUGE", null))), b));
            };
            List<MvcTestResult> resultados = emParalelo(largada, salvaA, salvaB);
            List<Integer> status = resultados.stream().map(IntegracaoTest::status).toList();
            assertThat(status).as("rodada %d: %s / %s", rodada, texto(resultados.get(0)), texto(resultados.get(1)))
                    .allMatch(s -> s == 200 || s == 409).contains(200);

            JsonNode vistoDeA = corpo(get("/api/pessoas/" + idA, token)).path("vinculos");
            JsonNode vistoDeB = corpo(get("/api/pessoas/" + idB, token)).path("vinculos");
            assertThat(vistoDeA.size()).as("rodada %d: um vínculo só", rodada).isEqualTo(1);
            assertThat(vistoDeB.size()).isEqualTo(1);
            String tipoEmA = vistoDeA.get(0).path("tipo").asString();
            String tipoEmB = vistoDeB.get(0).path("tipo").asString();
            assertThat(List.of(tipoEmA, tipoEmB)).as("rodada %d: os dois lados dizem a mesma coisa", rodada)
                    .isIn(List.of("DEPENDENTE", "RESPONSAVEL"), List.of("CONJUGE", "CONJUGE"));
        }
    }

    // ------------------------------------------------------------ seleção

    @Test
    void selecaoSoAtivasAte20EIgnoraId() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String prefixo = unico("Combo");
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 22; i++) {
            ids.add(criar(token, pf(prefixo + " " + (char) ('A' + i), t)).path("id").asString());
        }
        String inativa = ids.get(0);
        assertThat(status(patch("/api/pessoas/" + inativa + "/inativar", token))).isEqualTo(204);

        JsonNode combo = corpo(get("/api/pessoas/selecao?busca=" + prefixo.toUpperCase(), token));
        assertThat(combo.size()).isEqualTo(20);
        assertThat(ids(combo)).doesNotContain(inativa);
        assertThat(combo.get(0).path("nome").asString()).as("por nome").isEqualTo(prefixo + " B");
        assertThat(combo.get(0).path("codPessoa").asLong()).isEqualTo(2);
        assertThat(combo.get(0).has("cpf")).as("só id, código e nome").isFalse();
        assertThat(combo.get(0).size()).isEqualTo(3);

        assertThat(ids(get("/api/pessoas/selecao?busca=" + prefixo + "&ignorarId=" + ids.get(1), token)))
                .doesNotContain(ids.get(1)).contains(ids.get(21));
    }

    @Test
    void selecaoNaoTrazOutroContratante() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String prefixo = unico("Vizinho");
        String deA = criar(ca.admin().token(), pf(prefixo + " A", tipos(ca.admin().token()))).path("id").asString();
        String deB = criar(cb.admin().token(), pf(prefixo + " B", tipos(cb.admin().token()))).path("id").asString();
        assertThat(ids(get("/api/pessoas/selecao?busca=" + prefixo, cb.admin().token()))).containsExactly(deB);
        assertThat(ids(get("/api/pessoas/selecao?busca=" + prefixo, ca.admin().token()))).containsExactly(deA);
    }

    // ------------------------------------------------------------ dados complementares

    /** Todos os campos novos da física, normalizados, na ida e na volta (POST, GET, PUT). */
    @Test
    void complemento_caminhoFelizPF() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Civis cv = civis(token);
        Map<String, Object> corpo = com(completaPF(unico("Completa"), t, cv),
                "rgOrgaoEmissor", " ssp/sp ", "cnh", "026.503.064-61", "nacionalidade", "  Brasileira ",
                "nomeMae", " Maria da Silva ", "nomePai", "  ");

        JsonNode p = criar(token, corpo);
        assertThat(p.path("rg").asString()).isEqualTo("12345678X");
        assertThat(p.path("rgOrgaoEmissor").asString()).as("maiúsculas, sem espaço nas pontas").isEqualTo("SSP/SP");
        assertThat(p.path("rgUf").path("id").asString()).isEqualTo(cv.ufSp());
        assertThat(p.path("rgUf").path("sigla").asString()).isEqualTo("SP");
        assertThat(p.path("rgUf").path("nome").asString()).isEqualTo("São Paulo");
        assertThat(p.path("rgDataEmissao").asString()).isEqualTo("2008-03-10");
        assertThat(p.path("cnh").asString()).as("só os dígitos").isEqualTo("02650306461");
        assertThat(p.path("cnhCategoria").asString()).isEqualTo("AB");
        assertThat(p.path("cnhValidade").asString()).isEqualTo("2031-08-20");
        assertThat(p.path("estadoCivil").path("id").asString()).isEqualTo(cv.casado());
        assertThat(p.path("estadoCivil").path("nome").asString()).isEqualTo("Casado(a)");
        assertThat(p.path("estadoCivil").path("chave").asString()).isEqualTo("CASADO");
        assertThat(p.path("estadoCivil").path("ativo").asBoolean()).isTrue();
        assertThat(p.path("profissao").path("chave").asString()).isEqualTo("AUTONOMO");
        assertThat(p.path("nacionalidade").asString()).isEqualTo("Brasileira");
        assertThat(p.path("naturalidade").path("id").asString()).isEqualTo(t.outraCidade());
        assertThat(p.path("naturalidade").path("nome").asString()).isEqualTo("Campinas");
        assertThat(p.path("naturalidade").path("uf").asString()).isEqualTo("SP");
        assertThat(p.path("nomeMae").asString()).isEqualTo("Maria da Silva");
        assertThat(p.path("nomePai").isNull()).as("só espaços = não informado").isTrue();
        assertThat(p.path("dataAbertura").isNull()).isTrue();

        String id = p.path("id").asString();
        JsonNode ficha = corpo(get("/api/pessoas/" + id, token));
        for (String campo : List.of("rgOrgaoEmissor", "rgUf", "rgDataEmissao", "cnh", "cnhCategoria", "cnhValidade",
                "estadoCivil", "profissao", "nacionalidade", "naturalidade", "nomeMae", "nomePai")) {
            assertThat(ficha.path(campo)).as(campo).isEqualTo(p.path(campo));
        }

        JsonNode al = corpo(put("/api/pessoas/" + id, token, versao(com(corpo,
                "estadoCivilId", cv.solteiro(), "rgEstadoId", cv.ufRs(), "cnhCategoria", "B", "naturalidadeId", null,
                "nomePai", "João da Silva"), ficha)));
        assertThat(al.path("estadoCivil").path("chave").asString()).isEqualTo("SOLTEIRO");
        assertThat(al.path("rgUf").path("sigla").asString()).isEqualTo("RS");
        assertThat(al.path("cnhCategoria").asString()).isEqualTo("B");
        assertThat(al.path("naturalidade").isNull()).as("limpar = mandar nulo").isTrue();
        assertThat(al.path("nomePai").asString()).isEqualTo("João da Silva");
        assertThat(al.path("version").asLong()).isGreaterThan(ficha.path("version").asLong());
    }

    @Test
    void complemento_caminhoFelizPJ() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode p = criar(token, com(pj(unico("Aberta SA"), t), "dataAbertura", "2015-06-01"));
        assertThat(p.path("dataAbertura").asString()).isEqualTo("2015-06-01");
        assertThat(p.path("cnh").isNull()).isTrue();
        assertThat(p.path("estadoCivil").isNull()).isTrue();
        assertThat(p.path("rgUf").isNull()).isTrue();
        assertThat(p.path("naturalidade").isNull()).isTrue();

        JsonNode al = corpo(put("/api/pessoas/" + p.path("id").asString(), token,
                versao(com(pj(p.path("nome").asString(), t), "dataAbertura", null), p)));
        assertThat(al.path("dataAbertura").isNull()).isTrue();
    }

    /** Cada um dos 12 campos novos da física, sozinho numa jurídica: 400 nele (antes de qualquer busca). */
    @Test
    void campoDePfNaPj400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Map<String, Object> camposDaFisica = new java.util.LinkedHashMap<>();
        camposDaFisica.put("rgOrgaoEmissor", "SSP");
        camposDaFisica.put("rgEstadoId", UUID.randomUUID().toString());
        camposDaFisica.put("rgDataEmissao", "2008-03-10");
        camposDaFisica.put("cnh", "02650306461");
        camposDaFisica.put("cnhCategoria", "B");
        camposDaFisica.put("cnhValidade", "2031-08-20");
        camposDaFisica.put("estadoCivilId", UUID.randomUUID().toString());
        camposDaFisica.put("profissaoId", UUID.randomUUID().toString());
        camposDaFisica.put("nacionalidade", "Brasileira");
        camposDaFisica.put("naturalidadeId", t.cidade());
        camposDaFisica.put("nomeMae", "Maria");
        camposDaFisica.put("nomePai", "João");
        assertThat(camposDaFisica).hasSize(12);
        camposDaFisica.forEach((campo, valor) ->
                assertThat(campos(post("/api/pessoas", token, com(pj("X", t), campo, valor)))).as(campo)
                        .containsExactly(campo));
        assertThat(mensagem(post("/api/pessoas", token, com(pj("X", t), "cnh", "02650306461"))))
                .isEqualTo("Pessoa jurídica não tem CNH.");
        assertThat(mensagem(post("/api/pessoas", token, com(pj("X", t), "nomeMae", "Maria"))))
                .isEqualTo("Pessoa jurídica não tem filiação.");
        assertThat(status(post("/api/pessoas", token, com(pj(unico("Vazios"), t), "cnh", " ", "nomeMae", ""))))
                .as("vazio conta como não informado").isEqualTo(201);
    }

    @Test
    void dataAberturaNaPf400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "dataAbertura", "2015-06-01"));
        assertThat(campos(r)).containsExactly("dataAbertura");
        assertThat(mensagem(r)).isEqualTo("Pessoa física não tem data de abertura.");
    }

    /** PF completa vira PJ: todas as colunas da física ficam nulas no banco, e o contrário. */
    @Test
    void trocaDeTipoLimpaComplementos() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Civis cv = civis(token);
        JsonNode fisica = criar(token, completaPF(unico("Vira PJ"), t, cv));
        String id = fisica.path("id").asString();

        JsonNode juridica = corpo(put("/api/pessoas/" + id, token,
                versao(com(pj(unico("Vira PJ SA"), t), "dataAbertura", "2015-06-01"), fisica)));
        assertThat(juridica.path("tipoPessoa").asString()).isEqualTo("JURIDICA");
        Map<String, Object> linha = jdbc.queryForMap("""
                SELECT rg_orgao_emissor, rg_estado_id, rg_data_emissao, cnh, cnh_categoria, cnh_validade,
                       estado_civil_id, profissao_id, nacionalidade, naturalidade_id, nome_mae, nome_pai, data_abertura
                FROM pessoa WHERE id = ?""", UUID.fromString(id));
        assertThat(linha).hasSize(13);
        linha.forEach((coluna, valor) -> {
            if (!coluna.equals("data_abertura")) {
                assertThat(valor).as(coluna).isNull();
            }
        });
        assertThat(linha.get("data_abertura")).isNotNull();

        corpo(put("/api/pessoas/" + id, token, versao(pf(unico("Volta"), t), juridica)));
        assertThat(jdbc.queryForObject("SELECT data_abertura FROM pessoa WHERE id = ?", java.sql.Date.class,
                UUID.fromString(id))).isNull();
    }

    @Test
    void cnhDvInvalido400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        for (String errada : List.of("02650306462", "00000000000", "0265030646", "0265030646A")) {
            MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "cnh", errada));
            assertThat(campos(r)).as(errada).containsExactly("cnh");
            assertThat(mensagem(r)).isEqualTo("CNH inválida.");
        }
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "cnh", "0".repeat(15))))).containsExactly("cnh");
    }

    /** Decisão do dono (20/11/2026): o número da CNH pode ir sozinho. */
    @Test
    void cnhSozinhaAceita() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode p = criar(token, com(pf(unico("Só CNH"), t), "cnh", "60192922408"));
        assertThat(p.path("cnh").asString()).isEqualTo("60192922408");
        assertThat(p.path("cnhCategoria").isNull()).isTrue();
        assertThat(p.path("cnhValidade").isNull()).isTrue();
        assertThat(criar(token, com(pf(unico("Com categoria"), t), "cnh", "76269908502", "cnhCategoria", "D"))
                .path("cnhValidade").isNull()).isTrue();
    }

    @Test
    void categoriaOuValidadeSemNumero400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult categoria = post("/api/pessoas", token, com(pf("X", t), "cnhCategoria", "B"));
        assertThat(campos(categoria)).containsExactly("cnh");
        assertThat(mensagem(categoria)).isEqualTo("Informe o número da CNH.");
        MvcTestResult validade = post("/api/pessoas", token, com(pf("X", t), "cnh", "  ", "cnhValidade", "2030-01-01"));
        assertThat(campos(validade)).containsExactly("cnh");
        assertThat(mensagem(validade)).isEqualTo("Informe o número da CNH.");
    }

    @Test
    void cnhCategoriaForaDoEnum400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        assertThat(status(post("/api/pessoas", token, com(pf("X", t), "cnh", "02650306461", "cnhCategoria", "Z"))))
                .isEqualTo(400);
        assertThat(status(post("/api/pessoas", token, com(pf("X", t), "cnh", "02650306461", "cnhCategoria", "ab"))))
                .isEqualTo(400);
    }

    /** Vencida é aceita (a tela mostra "Vencida"); o limite é só contra erro de digitação. */
    @Test
    void cnhVencidaAceita200() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode p = criar(token, com(pf(unico("Vencida"), t), "cnh", "02650306461", "cnhValidade", "2001-01-01"));
        assertThat(p.path("cnhValidade").asString()).isEqualTo("2001-01-01");

        String longe = java.time.LocalDate.now().plusYears(16).toString();
        MvcTestResult futura = post("/api/pessoas", token, com(pf("X", t), "cnh", "02650306461", "cnhValidade", longe));
        assertThat(campos(futura)).containsExactly("cnhValidade");
        assertThat(mensagem(futura)).isEqualTo("Validade da CNH inválida.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "cnh", "02650306461", "cnhValidade", "1899-12-31"))))
                .containsExactly("cnhValidade");
        String quase = java.time.LocalDate.now().plusYears(15).toString();
        assertThat(status(post("/api/pessoas", token, com(pf(unico("Teto"), t), "cnh", "02650306461",
                "cnhValidade", quase)))).as("hoje + 15 anos ainda passa").isEqualTo(201);
    }

    @Test
    void rgComplementoSemRg400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Civis cv = civis(token);
        for (Object[] par : List.of(new Object[] {"rgOrgaoEmissor", "SSP"}, new Object[] {"rgEstadoId", cv.ufSp()},
                new Object[] {"rgDataEmissao", "2008-03-10"})) {
            MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "rg", " ", par[0], par[1]));
            assertThat(campos(r)).as((String) par[0]).containsExactly("rg");
            assertThat(mensagem(r)).isEqualTo("Informe o número do RG.");
        }
        MvcTestResult orgao = post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgOrgaoEmissor", "SSP#1"));
        assertThat(campos(orgao)).containsExactly("rgOrgaoEmissor");
        assertThat(mensagem(orgao)).isEqualTo("Órgão emissor inválido.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgOrgaoEmissor", "S"))))
                .containsExactly("rgOrgaoEmissor");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgOrgaoEmissor", "S".repeat(16)))))
                .containsExactly("rgOrgaoEmissor");
        assertThat(criar(token, com(pf(unico("Rg so"), t), "rg", "1234567")).path("rgUf").isNull())
                .as("o RG continua podendo ir sozinho").isTrue();
    }

    @Test
    void emissaoFutura400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgDataEmissao", "2999-01-01"));
        assertThat(campos(r)).containsExactly("rgDataEmissao");
        assertThat(mensagem(r)).isEqualTo("Data de emissão não pode ser no futuro");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgDataEmissao", "1899-12-31"))))
                .containsExactly("rgDataEmissao");
    }

    @Test
    void emissaoAntesDoNascimento400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "rg", "1234567",
                "dataNascimento", "1990-05-17", "rgDataEmissao", "1990-05-16"));
        assertThat(campos(r)).containsExactly("rgDataEmissao");
        assertThat(mensagem(r)).isEqualTo("A emissão não pode ser anterior ao nascimento.");
        assertThat(status(post("/api/pessoas", token, com(pf(unico("No dia"), t), "rg", "1234567",
                "dataNascimento", "1990-05-17", "rgDataEmissao", "1990-05-17")))).isEqualTo(201);
    }

    @Test
    void aberturaFutura400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pj("X", t), "dataAbertura", "2999-01-01"));
        assertThat(campos(r)).containsExactly("dataAbertura");
        assertThat(mensagem(r)).isEqualTo("Data de abertura não pode ser no futuro");
        MvcTestResult antiga = post("/api/pessoas", token, com(pj("X", t), "dataAbertura", "1799-12-31"));
        assertThat(campos(antiga)).containsExactly("dataAbertura");
        assertThat(mensagem(antiga)).isEqualTo("Data de abertura inválida.");
    }

    @Test
    void nacionalidadeForaDoTamanho400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult curta = post("/api/pessoas", token, com(pf("X", t), "nacionalidade", " B "));
        assertThat(campos(curta)).containsExactly("nacionalidade");
        assertThat(mensagem(curta)).isEqualTo("Nacionalidade deve ter de 2 a 40 caracteres.");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "nacionalidade", "N".repeat(41)))))
                .containsExactly("nacionalidade");
        assertThat(campos(post("/api/pessoas", token, com(pf("X", t), "nomeMae", "M".repeat(256)))))
                .containsExactly("nomeMae");
    }

    /** IDOR: o id do estado civil (ou da profissão) de outro contratante é "não encontrado". */
    @Test
    void estadoCivilDeOutroContratante400() {
        Contratante ca = novoContratante();
        Contratante cb = novoContratante();
        String tokenA = ca.admin().token();
        Tipos ta = tipos(tokenA);
        Civis deB = civis(cb.admin().token());
        String proprioDeB = corpo(post("/api/estados-civis", cb.admin().token(), Map.of("nome", unico("Noivo"))))
                .path("id").asString();

        for (String alheio : List.of(deB.casado(), proprioDeB, UUID.randomUUID().toString())) {
            MvcTestResult r = post("/api/pessoas", tokenA, com(pf("X", ta), "estadoCivilId", alheio));
            assertThat(campos(r)).containsExactly("estadoCivilId");
            assertThat(mensagem(r)).isEqualTo("Estado civil não encontrado.");
        }
        MvcTestResult profissao = post("/api/pessoas", tokenA, com(pf("X", ta), "profissaoId", deB.autonomo()));
        assertThat(campos(profissao)).containsExactly("profissaoId");
        assertThat(mensagem(profissao)).isEqualTo("Profissão não encontrada.");
    }

    @Test
    void profissaoInativaNova400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult profissao = post("/api/pessoas", token, com(pf("X", t), "profissaoId", tipoInativo(token, "/api/profissoes")));
        assertThat(campos(profissao)).containsExactly("profissaoId");
        assertThat(mensagem(profissao)).isEqualTo("Profissão inativa.");
        MvcTestResult estadoCivil = post("/api/pessoas", token, com(pf("X", t), "estadoCivilId",
                tipoInativo(token, "/api/estados-civis")));
        assertThat(campos(estadoCivil)).containsExactly("estadoCivilId");
        assertThat(mensagem(estadoCivil)).isEqualTo("Estado civil inativo.");
    }

    @Test
    void profissaoInativaJaGravadaContinuaAceita() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String profissao = corpo(post("/api/profissoes", token, Map.of("nome", unico("Ferreiro")))).path("id").asString();
        String estadoCivil = corpo(post("/api/estados-civis", token, Map.of("nome", unico("Noivo")))).path("id").asString();
        Map<String, Object> corpo = com(pf(unico("Antiga"), t), "profissaoId", profissao, "estadoCivilId", estadoCivil);
        JsonNode p = criar(token, corpo);
        assertThat(status(patch("/api/profissoes/" + profissao + "/inativar", token))).isEqualTo(204);
        assertThat(status(patch("/api/estados-civis/" + estadoCivil + "/inativar", token))).isEqualTo(204);

        JsonNode ficha = corpo(get("/api/pessoas/" + p.path("id").asString(), token));
        assertThat(ficha.path("profissao").path("ativo").asBoolean()).as("aparece como inativa").isFalse();
        assertThat(ficha.path("estadoCivil").path("ativo").asBoolean()).isFalse();
        MvcTestResult mesma = put("/api/pessoas/" + p.path("id").asString(), token,
                versao(com(corpo, "observacao", "mudou"), ficha));
        assertThat(status(mesma)).as(texto(mesma)).isEqualTo(200);

        assertThat(mensagem(post("/api/pessoas", token, com(pf("Nova", t), "profissaoId", profissao))))
                .isEqualTo("Profissão inativa.");
    }

    @Test
    void ufInexistente400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "rg", "1234567", "rgEstadoId", UUID.randomUUID().toString()));
        assertThat(campos(r)).containsExactly("rgEstadoId");
        assertThat(mensagem(r)).isEqualTo("UF não encontrada.");
    }

    @Test
    void naturalidadeInexistente400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "naturalidadeId", UUID.randomUUID().toString()));
        assertThat(campos(r)).containsExactly("naturalidadeId");
        assertThat(mensagem(r)).isEqualTo("Cidade não encontrada.");
    }

    /** LGPD: a lista (e por ela o Exportar e o Pdf) e o combo não levam nenhum dado complementar. */
    @Test
    void listaEExportacaoSemComplementos() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String nome = unico("Sigilo");
        String id = criar(token, completaPF(nome, t, civis(token))).path("id").asString();

        JsonNode linha = item(get("/api/pessoas?busca=" + nome, token), id);
        JsonNode combo = corpo(get("/api/pessoas/selecao?busca=" + nome, token)).get(0);
        for (String campo : List.of("cnh", "cnhCategoria", "cnhValidade", "nomeMae", "nomePai", "estadoCivil",
                "profissao", "rgOrgaoEmissor", "rgUf", "rgDataEmissao", "nacionalidade", "naturalidade")) {
            assertThat(linha.has(campo)).as("lista: " + campo).isFalse();
            assertThat(combo.has(campo)).as("combo: " + campo).isFalse();
        }
        assertThat(texto(get("/api/pessoas?busca=" + nome, token))).doesNotContain("02650306461", "Maria da Silva");
    }

    // ------------------------------------------------------------ representante legal

    /** PJ A põe PF B como representante legal; B vê A como empresa representada. */
    @Test
    void representante_apareceNosDoisLados() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        JsonNode empresa = criar(token, pj(unico("Acme SA"), t));
        JsonNode fulano = criar(token, pf(unico("Fulano"), t));
        String idEmpresa = empresa.path("id").asString();
        String idFulano = fulano.path("id").asString();

        JsonNode al = corpo(put("/api/pessoas/" + idEmpresa, token, versao(com(pj(empresa.path("nome").asString(), t),
                "vinculos", List.of(vinculo(idFulano, "REPRESENTANTE_LEGAL", "sócio-administrador"))), empresa)));
        assertThat(al.path("vinculos").get(0).path("tipo").asString()).isEqualTo("REPRESENTANTE_LEGAL");

        JsonNode vistoDeFulano = corpo(get("/api/pessoas/" + idFulano, token)).path("vinculos").get(0);
        assertThat(vistoDeFulano.path("pessoa").path("id").asString()).isEqualTo(idEmpresa);
        assertThat(vistoDeFulano.path("tipo").asString()).isEqualTo("REPRESENTADA");
        assertThat(vistoDeFulano.path("observacao").asString()).isEqualTo("sócio-administrador");

        // Pelo lado da PF: Beltrano diz que a empresa é a representada dele.
        JsonNode beltrano = criar(token, com(pf(unico("Beltrano"), t), "vinculos",
                List.of(vinculo(idEmpresa, "REPRESENTADA", null))));
        JsonNode vistoDaEmpresa = corpo(get("/api/pessoas/" + idEmpresa, token)).path("vinculos");
        assertThat(vistoDaEmpresa.valueStream()
                .filter(v -> v.path("pessoa").path("id").asString().equals(beltrano.path("id").asString()))
                .findFirst().orElseThrow().path("tipo").asString()).isEqualTo("REPRESENTANTE_LEGAL");
    }

    @Test
    void representantePJ400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String outraPj = criar(token, pj(unico("Holding SA"), t)).path("id").asString();
        MvcTestResult r = post("/api/pessoas", token, com(pj("X", t), "vinculos",
                List.of(vinculo(outraPj, "REPRESENTANTE_LEGAL", null))));
        assertThat(campos(r)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(r)).isEqualTo("O representante legal precisa ser pessoa física.");

        String empresa = criar(token, pj(unico("Acme SA"), t)).path("id").asString();
        MvcTestResult pjRepresentante = post("/api/pessoas", token, com(pj("X", t), "vinculos",
                List.of(vinculo(empresa, "REPRESENTADA", null))));
        assertThat(campos(pjRepresentante)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(pjRepresentante)).isEqualTo("O representante legal precisa ser pessoa física.");
    }

    @Test
    void representanteEmPF400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String fulano = criar(token, pf(unico("Fulano"), t)).path("id").asString();
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "vinculos",
                List.of(vinculo(fulano, "REPRESENTANTE_LEGAL", null))));
        assertThat(campos(r)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(r)).isEqualTo("Só pessoa jurídica tem representante legal.");
    }

    @Test
    void representadaPF400() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String fulano = criar(token, pf(unico("Fulano"), t)).path("id").asString();
        MvcTestResult r = post("/api/pessoas", token, com(pf("X", t), "vinculos",
                List.of(vinculo(fulano, "REPRESENTADA", null))));
        assertThat(campos(r)).containsExactly("vinculos[0].tipo");
        assertThat(mensagem(r)).isEqualTo("A empresa representada precisa ser pessoa jurídica.");
    }

    @Test
    void variosRepresentantes200() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String um = criar(token, pf(unico("Sócio A"), t)).path("id").asString();
        String dois = criar(token, pf(unico("Sócio B"), t)).path("id").asString();
        String contato = criar(token, pf(unico("Contato"), t)).path("id").asString();
        JsonNode empresa = criar(token, com(pj(unico("Dupla SA"), t), "vinculos", List.of(
                vinculo(um, "REPRESENTANTE_LEGAL", null), vinculo(dois, "REPRESENTANTE_LEGAL", null),
                vinculo(contato, "CONTATO", null))));
        assertThat(empresa.path("vinculos").valueStream().map(v -> v.path("tipo").asString()).toList())
                .containsExactlyInAnyOrder("REPRESENTANTE_LEGAL", "REPRESENTANTE_LEGAL", "CONTATO");
    }

    /** As restrições do banco seguram mesmo sem passar pelo Java (as linhas antigas da 015 continuam valendo). */
    @Test
    void checksDoBanco() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        Civis cv = civis(token);
        UUID semCnh = UUID.fromString(criar(token, com(pf(unico("Sem CNH"), t), "rg", "1234567")).path("id").asString());
        UUID completa = UUID.fromString(criar(token, completaPF(unico("Completa"), t, cv)).path("id").asString());
        UUID empresa = UUID.fromString(criar(token, pj(unico("Empresa"), t)).path("id").asString());

        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET cnh_categoria = 'B' WHERE id = ?", semCnh))
                .as("categoria sem número").hasMessageContaining("ck_pessoa_cnh_complemento");
        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET cnh_validade = DATE '2030-01-01' WHERE id = ?", semCnh))
                .hasMessageContaining("ck_pessoa_cnh_complemento");
        assertThat(jdbc.update("UPDATE pessoa SET cnh = '02650306461' WHERE id = ?", semCnh)).as("número sozinho").isEqualTo(1);
        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET cnh = '1234' WHERE id = ?", semCnh))
                .hasMessageContaining("ck_pessoa_cnh");
        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET cnh_categoria = 'Z' WHERE id = ?", semCnh))
                .hasMessageContaining("ck_pessoa_cnh_categoria");
        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET rg = NULL WHERE id = ?", completa))
                .as("órgão, UF e emissão sem RG").hasMessageContaining("ck_pessoa_rg_complemento");
        assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET data_abertura = DATE '2015-06-01' WHERE id = ?", semCnh))
                .as("abertura na física").hasMessageContaining("ck_pessoa_campos_do_tipo");
        for (String coluna : List.of("nome_mae = 'Maria'", "nacionalidade = 'Brasileira'", "cnh = '02650306461'")) {
            assertThatThrownBy(() -> jdbc.update("UPDATE pessoa SET " + coluna + " WHERE id = ?", empresa))
                    .as(coluna).hasMessageContaining("ck_pessoa_campos_do_tipo");
        }

        String definicao = jdbc.queryForObject(
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'ck_pessoa_vinculo_tipo'", String.class);
        assertThat(definicao).contains("REPRESENTANTE_LEGAL", "REPRESENTADA", "CONTATO", "EMPRESA");
    }

    /**
     * A ficha lê a UF do RG, o estado civil, a profissão e a naturalidade (com a UF dela) dentro
     * da transação: no máximo 5 comandos a mais que a ficha sem complementos, nunca um por item.
     */
    @Test
    void fichaSemNMais1() {
        Contratante c = novoContratante();
        String token = c.admin().token();
        Tipos t = tipos(token);
        String outra = criar(token, pf(unico("Parente"), t)).path("id").asString();
        String id = criar(token, com(completaPF(unico("Ficha"), t, civis(token)),
                "tiposCadastroIds", List.of(t.cliente(), t.fornecedor()),
                "telefones", List.of(telefone(t.celular(), "11987654321", true), telefone(t.whatsapp(), "11912345678", false)),
                "emails", List.of(email(t.particular(), "f@x.com", true)),
                "redesSociais", List.of(rede(t.instagram(), "@f", null)),
                "enderecos", List.of(endereco(t.residencial(), t.cidade(), true)),
                "vinculos", List.of(vinculo(outra, "FAMILIAR", null)))).path("id").asString();
        String simples = criar(token, pf(unico("Simples"), t)).path("id").asString();

        Statistics estatisticas = emf.unwrap(SessionFactory.class).getStatistics();
        boolean ligadas = estatisticas.isStatisticsEnabled();
        estatisticas.setStatisticsEnabled(true);
        try {
            estatisticas.clear();
            assertThat(status(get("/api/pessoas/" + simples, token))).isEqualTo(200);
            long semComplementos = estatisticas.getPrepareStatementCount();
            estatisticas.clear();
            assertThat(status(get("/api/pessoas/" + id, token))).isEqualTo(200);
            long completa = estatisticas.getPrepareStatementCount();
            assertThat(completa - semComplementos).as("UF do RG, estado civil, profissão, naturalidade e a UF dela")
                    .isLessThanOrEqualTo(5);
            assertThat(completa).as("hoje: 8 sem complementos, 11 com").isLessThanOrEqualTo(12);
        } finally {
            estatisticas.setStatisticsEnabled(ligadas);
        }
    }

    // ------------------------------------------------------------ apoio

    /** Ids do contratante para os dados civis: itens do sistema e duas UFs. */
    record Civis(String casado, String solteiro, String autonomo, String ufSp, String ufRs) {
    }

    private Civis civis(String token) {
        JsonNode estados = corpo(get("/api/estados", token));
        return new Civis(
                chave(token, "/api/estados-civis", "CASADO"),
                chave(token, "/api/estados-civis", "SOLTEIRO"),
                chave(token, "/api/profissoes", "AUTONOMO"),
                uf(estados, "SP"),
                uf(estados, "RS"));
    }

    private static String uf(JsonNode estados, String sigla) {
        return estados.valueStream().filter(n -> sigla.equals(n.path("sigla").asString()))
                .findFirst().orElseThrow().path("id").asString();
    }

    /** Física com todos os documentos e dados civis (CNH 026.503.064-61, naturalidade Campinas). */
    private static Map<String, Object> completaPF(String nome, Tipos t, Civis cv) {
        return com(pf(nome, t),
                "rg", "12.345.678-x", "dataNascimento", "1990-05-17",
                "rgOrgaoEmissor", "SSP", "rgEstadoId", cv.ufSp(), "rgDataEmissao", "2008-03-10",
                "cnh", "02650306461", "cnhCategoria", "AB", "cnhValidade", "2031-08-20",
                "estadoCivilId", cv.casado(), "profissaoId", cv.autonomo(), "nacionalidade", "Brasileira",
                "naturalidadeId", t.outraCidade(), "nomeMae", "Maria da Silva", "nomePai", "João da Silva");
    }

    private Tipos tipos(String token) {
        return new Tipos(
                chave(token, "/api/tipos-cadastro", "CLIENTE"),
                chave(token, "/api/tipos-cadastro", "FORNECEDOR"),
                chave(token, "/api/tipos-telefone", "CELULAR"),
                chave(token, "/api/tipos-telefone", "WHATSAPP"),
                chave(token, "/api/tipos-email", "PARTICULAR"),
                chave(token, "/api/tipos-endereco", "RESIDENCIAL"),
                chave(token, "/api/tipos-rede-social", "INSTAGRAM"),
                cidade(token, "/api/cidades/selecao?busca=sao paulo&uf=SP", "São Paulo"),
                cidade(token, "/api/cidades/selecao?busca=campinas&uf=SP", "Campinas"));
    }

    private String chave(String token, String rota, String chave) {
        return corpo(get(rota + "/selecao", token)).valueStream()
                .filter(n -> chave.equals(n.path("chave").asString()))
                .findFirst().orElseThrow().path("id").asString();
    }

    private String cidade(String token, String uri, String nome) {
        return corpo(get(uri, token)).valueStream()
                .filter(n -> nome.equals(n.path("nome").asString()))
                .findFirst().orElseThrow().path("id").asString();
    }

    /** Item próprio de um auxiliar, já inativado. */
    private String tipoInativo(String token, String rota) {
        String id = corpo(post(rota, token, Map.of("nome", unico("Velho")))).path("id").asString();
        assertThat(status(patch(rota + "/" + id + "/inativar", token))).isEqualTo(204);
        return id;
    }

    private static Map<String, Object> pf(String nome, Tipos t) {
        return base("FISICA", nome, t);
    }

    private static Map<String, Object> pj(String nome, Tipos t) {
        return base("JURIDICA", nome, t);
    }

    private static Map<String, Object> base(String tipoPessoa, String nome, Tipos t) {
        Map<String, Object> m = new HashMap<>();
        m.put("tipoPessoa", tipoPessoa);
        m.put("nome", nome);
        m.put("tiposCadastroIds", List.of(t.cliente()));
        m.put("telefones", List.of());
        m.put("emails", List.of());
        m.put("redesSociais", List.of());
        m.put("enderecos", List.of());
        m.put("vinculos", List.of());
        return m;
    }

    /** Cópia de {@code corpo} com os pares chave, valor trocados (valor pode ser nulo). */
    private static Map<String, Object> com(Map<String, Object> corpo, Object... pares) {
        Map<String, Object> m = new HashMap<>(corpo);
        for (int i = 0; i < pares.length; i += 2) {
            m.put((String) pares[i], pares[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> versao(Map<String, Object> corpo, JsonNode ficha) {
        return com(corpo, "version", ficha.path("version").asLong());
    }

    private static Map<String, Object> telefone(String tipoId, String numero, boolean principal) {
        return com(Map.of(), "tipoId", tipoId, "numero", numero, "observacao", null, "principal", principal);
    }

    private static Map<String, Object> email(String tipoId, String email, boolean principal) {
        return com(Map.of(), "tipoId", tipoId, "email", email, "observacao", null, "principal", principal);
    }

    private static Map<String, Object> rede(String tipoId, String usuario, String url) {
        return com(Map.of(), "tipoId", tipoId, "usuario", usuario, "url", url);
    }

    private static Map<String, Object> endereco(String tipoId, String cidadeId, boolean principal) {
        return com(Map.of(), "tipoId", tipoId, "cep", "01001000", "cidadeId", cidadeId, "rua", "Praça da Sé",
                "numero", "100", "bairro", "Sé", "complemento", null, "principal", principal);
    }

    private static Map<String, Object> vinculo(String pessoaId, String tipo, String observacao) {
        return com(Map.of(), "pessoaId", pessoaId, "tipo", tipo, "observacao", observacao);
    }

    private JsonNode criar(String token, Map<String, Object> corpo) {
        MvcTestResult r = post("/api/pessoas", token, corpo);
        assertThat(status(r)).as("criar pessoa: %s", texto(r)).isEqualTo(201);
        return corpo(r);
    }

    private long comandos(Statistics estatisticas, String uri, String token, int linhas) {
        estatisticas.clear();
        MvcTestResult r = get(uri, token);
        assertThat(corpo(r).path("conteudo").size()).isEqualTo(linhas);
        return estatisticas.getPrepareStatementCount();
    }

    private List<MvcTestResult> emParalelo(CountDownLatch largada, Callable<MvcTestResult> um,
                                           Callable<MvcTestResult> outro) throws Exception {
        try (var pool = Executors.newFixedThreadPool(2)) {
            var primeiro = pool.submit(um);
            var segundo = pool.submit(outro);
            largada.countDown();
            return List.of(primeiro.get(30, TimeUnit.SECONDS), segundo.get(30, TimeUnit.SECONDS));
        }
    }

    private List<String> campos(MvcTestResult r) {
        assertThat(status(r)).as("status com erros de campo: %s", texto(r)).isIn(400, 409);
        return corpo(r).path("erros").valueStream().map(e -> e.path("campo").asString()).toList();
    }

    private String mensagem(MvcTestResult r) {
        return corpo(r).path("erros").get(0).path("mensagem").asString();
    }

    private List<String> ids(MvcTestResult r) {
        assertThat(status(r)).as(texto(r)).isEqualTo(200);
        return ids(corpo(r));
    }

    private static List<String> ids(JsonNode n) {
        JsonNode lista = n.has("conteudo") ? n.path("conteudo") : n;
        return lista.valueStream().map(i -> i.path("id").asString()).toList();
    }

    private JsonNode item(MvcTestResult lista, String id) {
        assertThat(status(lista)).isEqualTo(200);
        return corpo(lista).path("conteudo").valueStream()
                .filter(n -> n.path("id").asString().equals(id)).findFirst().orElseThrow();
    }

    private static List<Boolean> principais(JsonNode lista) {
        return lista.valueStream().map(n -> n.path("principal").asBoolean()).toList();
    }

    private static String texto(MvcTestResult r) {
        try {
            return r.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        } catch (java.io.UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    /** CPF válido sorteado (11 dígitos, sem máscara). */
    private static String cpf() {
        while (true) {
            int[] d = new int[11];
            for (int i = 0; i < 9; i++) {
                d[i] = ThreadLocalRandom.current().nextInt(10);
            }
            d[9] = digitoCpf(d, 9);
            d[10] = digitoCpf(d, 10);
            StringBuilder s = new StringBuilder();
            for (int x : d) {
                s.append(x);
            }
            if (s.chars().distinct().count() > 1) {
                return s.toString();
            }
        }
    }

    private static int digitoCpf(int[] d, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += d[i] * (quantidade + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    /** CNPJ numérico válido sorteado (14 dígitos, sem máscara). */
    private static String cnpj() {
        int[] d = new int[14];
        for (int i = 0; i < 12; i++) {
            d[i] = ThreadLocalRandom.current().nextInt(10);
        }
        d[12] = digitoCnpj(d, new int[] {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        d[13] = digitoCnpj(d, new int[] {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        StringBuilder s = new StringBuilder();
        for (int x : d) {
            s.append(x);
        }
        return s.toString();
    }

    private static int digitoCnpj(int[] d, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += d[i] * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static String mascararCpf(String cpf) {
        return cpf.substring(0, 3) + "." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-" + cpf.substring(9);
    }
}
