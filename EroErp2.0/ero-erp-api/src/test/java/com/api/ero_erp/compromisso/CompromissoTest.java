package com.api.ero_erp.compromisso;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

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
 * Agenda. No antigo o conflito era um só para o tenant inteiro e o
 * responsável era quem digitava; aqui o responsável é escolhido, há
 * convidados, e o conflito é por usuário — o do responsável recusa, o do
 * convidado só avisa.
 */
@DisplayName("Agenda")
class CompromissoTest extends AbstractIntegrationTest {

    private String token;
    private UUID loja;
    private UUID cliente;
    private Usuario profissional;
    private Usuario outra;

    @BeforeEach
    void preparar() throws Exception {
        token = autenticar(adminA.getEmail());
        loja = criarMatriz(token, salvarPessoa(tenantA, "Clínica Centro").getId());
        cliente = salvarPessoa(tenantA, "Maria Cliente").getId();
        profissional = criarUsuario(tenantA, "prof.a@teste.local", Role.USER);
        outra = userA;
    }

    // ─────────────────────────────────────────────────────────────────
    //  Cadastro
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a recepção agenda para outro profissional, com convidado; a cor vem da filial")
    void agendaParaOutroResponsavel() throws Exception {
        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(outra.getId()), null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].responsavelId").value(profissional.getId().toString()))
                .andExpect(jsonPath("$[0].responsavelNome").value(profissional.getNome()))
                .andExpect(jsonPath("$[0].pessoaNome").value("Maria Cliente"))
                .andExpect(jsonPath("$[0].filialNome").value("Clínica Centro"))
                .andExpect(jsonPath("$[0].status").value("AGENDADO"))
                .andExpect(jsonPath("$[0].cor").doesNotExist())
                .andExpect(jsonPath("$[0].corExibicao").value("#3B82F6"))
                .andExpect(jsonPath("$[0].inicio").value("2027-03-10T13:00:00Z"))
                .andExpect(jsonPath("$[0].convidados", hasSize(1)))
                .andExpect(jsonPath("$[0].convidados[0].usuarioId").value(outra.getId().toString()))
                // Quem digitou não é o responsável
                .andExpect(jsonPath("$[0].criadoPorNome").value(adminA.getNome()));
    }

    @Test
    @DisplayName("período inválido, longo demais, convidado repetido ou o próprio responsável: 400")
    void validacoes() throws Exception {
        criar(json(profissional.getId(), "2027-03-10T14:00:00Z", "2027-03-10T14:00:00Z", List.of(), null))
                .andExpect(status().isBadRequest());
        criar(json(profissional.getId(), "2027-03-10T14:00:00Z", "2027-03-11T14:00:01Z", List.of(), null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Um compromisso dura no máximo 24 horas"));
        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(outra.getId(), outra.getId()), null))
                .andExpect(status().isBadRequest());
        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(profissional.getId()), null))
                .andExpect(status().isBadRequest());
        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z", List.of(),
                recorrencia("SEMANAL", 53)))
                .andExpect(status().isBadRequest());

        assertThat(compromissoRepository.findAll()).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Conflito
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("responsável ocupado recusa com 409; outro responsável no mesmo horário passa; encostado passa")
    void conflitoPorResponsavel() throws Exception {
        criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");

        criar(json(profissional.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z", List.of(), null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        profissional.getNome() + " já tem compromisso neste horário: \"Consulta\", 10/03/2027 às 10:00"));

        // O antigo bloqueava o tenant inteiro: aqui outra pessoa atende na mesma hora
        criar(json(outra.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z", List.of(), null))
                .andExpect(status().isCreated());
        // Termina às 14h e o outro começa às 14h: não se sobrepõem
        criar(json(profissional.getId(), "2027-03-10T14:00:00Z", "2027-03-10T15:00:00Z", List.of(), null))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("quem foi convidado está ocupado: não pode ser responsável de outro no mesmo horário")
    void convidadoOcupaOHorario() throws Exception {
        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(outra.getId()), null))
                .andExpect(status().isCreated());

        criar(json(outra.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z", List.of(), null))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("convidado ocupado não bloqueia: a disponibilidade avisa, e salvar passa")
    void convidadoOcupadoSoAvisa() throws Exception {
        criarUm(outra.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");

        disponibilidade(profissional.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z",
                List.of(outra.getId()), null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bloqueia").value(false))
                .andExpect(jsonPath("$.ocorrencias", hasSize(1)))
                .andExpect(jsonPath("$.ocorrencias[0].choques", hasSize(1)))
                .andExpect(jsonPath("$.ocorrencias[0].choques[0].usuarioId").value(outra.getId().toString()))
                .andExpect(jsonPath("$.ocorrencias[0].choques[0].responsavel").value(false))
                .andExpect(jsonPath("$.ocorrencias[0].choques[0].titulo").value("Consulta"));

        criar(json(profissional.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z",
                List.of(outra.getId()), null))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("a disponibilidade marca bloqueia quando o choque é do responsável, e ignora o próprio ao alterar")
    void disponibilidadeDoResponsavel() throws Exception {
        UUID id = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");

        disponibilidade(profissional.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z", List.of(), null, null)
                .andExpect(jsonPath("$.bloqueia").value(true))
                .andExpect(jsonPath("$.ocorrencias[0].choques[0].responsavel").value(true));

        disponibilidade(profissional.getId(), "2027-03-10T13:30:00Z", "2027-03-10T14:30:00Z", List.of(), null, id)
                .andExpect(jsonPath("$.bloqueia").value(false))
                .andExpect(jsonPath("$.ocorrencias[0].choques", hasSize(0)));
    }

    @Test
    @DisplayName("cancelado e falta liberam o horário")
    void canceladoEFaltaLiberam() throws Exception {
        UUID cancelado = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");
        acao(cancelado, "cancelar").andExpect(status().isOk());
        criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");

        UUID passado = criarUm(profissional.getId(), "2020-01-10T13:00:00Z", "2020-01-10T14:00:00Z");
        acao(passado, "faltou").andExpect(status().isOk());
        criarUm(profissional.getId(), "2020-01-10T13:00:00Z", "2020-01-10T14:00:00Z");
    }

    // ─────────────────────────────────────────────────────────────────
    //  Recorrência
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("semanal com 4 ocorrências cria a série inteira, na mesma hora de parede")
    void recorrenciaSemanal() throws Exception {
        JsonNode criados = corpo(criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(), recorrencia("SEMANAL", 4)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[1].inicio").value("2027-03-17T13:00:00Z"))
                .andExpect(jsonPath("$[3].inicio").value("2027-03-31T13:00:00Z"))
                .andExpect(jsonPath("$[3].fim").value("2027-03-31T14:00:00Z"))
                .andExpect(jsonPath("$[3].tipoRecorrencia").value("SEMANAL")));

        String serie = criados.get(0).get("serieId").asText();
        for (JsonNode c : criados) {
            assertThat(c.get("serieId").asText()).isEqualTo(serie);
        }
    }

    @Test
    @DisplayName("mensal a partir do dia 31 volta ao 31 depois de fevereiro")
    void recorrenciaMensalNaoEscorrega() throws Exception {
        criar(json(profissional.getId(), "2027-01-31T13:00:00Z", "2027-01-31T14:00:00Z",
                List.of(), recorrencia("MENSAL", 3)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[1].inicio").value("2027-02-28T13:00:00Z"))
                .andExpect(jsonPath("$[2].inicio").value("2027-03-31T13:00:00Z"));
    }

    @Test
    @DisplayName("choque numa ocorrência do meio recusa a série inteira, e nada é gravado")
    void conflitoNaSerieRecusaTudo() throws Exception {
        criarUm(profissional.getId(), "2027-03-24T13:30:00Z", "2027-03-24T14:30:00Z");

        disponibilidade(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z", List.of(),
                recorrencia("SEMANAL", 4), null)
                .andExpect(jsonPath("$.bloqueia").value(true))
                .andExpect(jsonPath("$.ocorrencias", hasSize(4)))
                .andExpect(jsonPath("$.ocorrencias[1].choques", hasSize(0)))
                .andExpect(jsonPath("$.ocorrencias[2].choques", hasSize(1)));

        criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(), recorrencia("SEMANAL", 4)))
                .andExpect(status().isConflict());
        assertThat(compromissoRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("cancelar 'este e os seguintes' deixa as ocorrências anteriores como estão")
    void cancelarSeguintes() throws Exception {
        JsonNode criados = corpo(criar(json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(), recorrencia("SEMANAL", 4))).andExpect(status().isCreated()));
        UUID terceira = UUID.fromString(criados.get(2).get("id").asText());

        mockMvc.perform(patch("/compromissos/{id}/cancelar", terceira).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"motivo":"Viagem","escopo":"SEGUINTES"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"))
                .andExpect(jsonPath("$.motivoCancelamento").value("Viagem"));

        List<StatusCompromisso> status = criados.findValues("id").stream()
                .map(id -> compromissoRepository.findById(UUID.fromString(id.asText())).orElseThrow().getStatus())
                .toList();
        assertThat(status).containsExactly(StatusCompromisso.AGENDADO, StatusCompromisso.AGENDADO,
                StatusCompromisso.CANCELADO, StatusCompromisso.CANCELADO);
    }

    // ─── A lista editada da prévia ─────────────────────────────────────

    @Test
    @DisplayName("série com uma data tirada e outra editada grava exatamente a lista que veio")
    void listaEditadaGravaComoVeio() throws Exception {
        // Toda semana × 4, sem a terceira (feriado) e com a quarta movida para as 15h
        criar(jsonSerie(profissional.getId(), "SEMANAL", 4,
                ocorrencia("2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z"),
                ocorrencia("2027-03-17T13:00:00Z", "2027-03-17T14:00:00Z"),
                ocorrencia("2027-03-31T18:00:00Z", "2027-03-31T19:00:00Z")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[1].inicio").value("2027-03-17T13:00:00Z"))
                .andExpect(jsonPath("$[2].inicio").value("2027-03-31T18:00:00Z"))
                .andExpect(jsonPath("$[2].fim").value("2027-03-31T19:00:00Z"))
                .andExpect(jsonPath("$[2].tipoRecorrencia").value("SEMANAL"));

        // As três da mesma série, e só as três
        assertThat(compromissoRepository.findAll().stream().map(c -> c.getSerieId()).toList())
                .hasSize(3)
                .doesNotContainNull()
                .containsOnly(compromissoRepository.findAll().getFirst().getSerieId());
    }

    @Test
    @DisplayName("a data editada também passa pelo conflito do responsável; sem ela, a série passa")
    void dataEditadaChocaComOResponsavel() throws Exception {
        criarUm(profissional.getId(), "2027-03-24T18:00:00Z", "2027-03-24T19:00:00Z");

        String comChoque = jsonSerie(profissional.getId(), "SEMANAL", 3,
                ocorrencia("2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z"),
                ocorrencia("2027-03-24T18:30:00Z", "2027-03-24T19:30:00Z"));
        disponibilidadeCom(comChoque)
                .andExpect(jsonPath("$.bloqueia").value(true))
                .andExpect(jsonPath("$.ocorrencias", hasSize(2)))
                .andExpect(jsonPath("$.ocorrencias[0].choques", hasSize(0)))
                .andExpect(jsonPath("$.ocorrencias[1].inicio").value("2027-03-24T18:30:00Z"))
                .andExpect(jsonPath("$.ocorrencias[1].choques", hasSize(1)));
        criar(comChoque).andExpect(status().isConflict());

        criar(jsonSerie(profissional.getId(), "SEMANAL", 3,
                ocorrencia("2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z"),
                ocorrencia("2027-03-24T13:00:00Z", "2027-03-24T14:00:00Z")))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("duas datas da lista que se sobrepõem são recusadas, nomeando as duas")
    void datasSobrepostas() throws Exception {
        criar(jsonSerie(profissional.getId(), "SEMANAL", 2,
                ocorrencia("2027-03-17T13:30:00Z", "2027-03-17T14:30:00Z"),
                ocorrencia("2027-03-17T13:00:00Z", "2027-03-17T14:00:00Z")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("As datas 17/03 às 10:00 e 17/03 às 10:30 se sobrepõem"));
        assertThat(compromissoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("lista de datas sem recorrência é 400; data com mais de 24 h também")
    void listaSemSerieOuInvalida() throws Exception {
        criar("""
                {"filialId":"%s","responsavelId":"%s","titulo":"Consulta",
                 "inicio":"2027-03-10T13:00:00Z","fim":"2027-03-10T14:00:00Z",
                 "ocorrencias":[%s]}
                """.formatted(loja, profissional.getId(), ocorrencia("2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z")))
                .andExpect(status().isBadRequest());
        criar(jsonSerie(profissional.getId(), "SEMANAL", 2,
                ocorrencia("2027-03-10T13:00:00Z", "2027-03-11T14:00:00Z")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Um compromisso dura no máximo 24 horas"));
    }

    @Test
    @DisplayName("tirando todas menos uma, sobra um compromisso avulso, sem série")
    void sobrouUmaData() throws Exception {
        criar(jsonSerie(profissional.getId(), "SEMANAL", 4,
                ocorrencia("2027-03-17T13:00:00Z", "2027-03-17T14:00:00Z")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].serieId").doesNotExist())
                .andExpect(jsonPath("$[0].tipoRecorrencia").doesNotExist());
    }

    @Test
    @DisplayName("'seguintes' num compromisso avulso é 400")
    void seguintesSemSerie() throws Exception {
        UUID id = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");
        mockMvc.perform(patch("/compromissos/{id}/cancelar", id).header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"escopo":"SEGUINTES"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Situação
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("confirmado e remarcado volta a agendado; concluído não se altera mais")
    void transicoes() throws Exception {
        UUID id = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");

        acao(id, "confirmar").andExpect(jsonPath("$.status").value("CONFIRMADO"));
        acao(id, "confirmar").andExpect(status().isConflict());

        // Só a descrição: continua confirmado
        alterar(id, json(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z",
                List.of(outra.getId()), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADO"))
                .andExpect(jsonPath("$.convidados", hasSize(1)));

        // Outro horário: a confirmação era do anterior
        alterar(id, json(profissional.getId(), "2027-03-10T15:00:00Z", "2027-03-10T16:00:00Z", List.of(), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AGENDADO"))
                .andExpect(jsonPath("$.convidados", hasSize(0)));

        acao(id, "concluir").andExpect(jsonPath("$.status").value("CONCLUIDO"));
        acao(id, "cancelar")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Este compromisso já foi concluído"));
        alterar(id, json(profissional.getId(), "2027-03-10T15:00:00Z", "2027-03-10T16:00:00Z", List.of(), null))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("falta só depois do horário de início")
    void faltaSoDepoisDoInicio() throws Exception {
        UUID futuro = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");
        acao(futuro, "faltou")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value("Só se marca falta depois do horário de início"));
    }

    // ─────────────────────────────────────────────────────────────────
    //  Calendário
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o calendário traz a janela pedida; filtrar por usuário inclui o que ele foi convidado")
    void calendario() throws Exception {
        criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");
        criar(json(outra.getId(), "2027-03-11T13:00:00Z", "2027-03-11T14:00:00Z",
                List.of(profissional.getId()), null)).andExpect(status().isCreated());
        criarUm(outra.getId(), "2027-03-12T13:00:00Z", "2027-03-12T14:00:00Z");
        criarUm(profissional.getId(), "2027-04-20T13:00:00Z", "2027-04-20T14:00:00Z");

        calendario("2027-03-01T03:00:00Z", "2027-04-01T03:00:00Z", null)
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].inicio").value("2027-03-10T13:00:00Z"));

        calendario("2027-03-01T03:00:00Z", "2027-04-01T03:00:00Z", profissional.getId())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].convidadoIds[0]").value(profissional.getId().toString()));
    }

    @Test
    @DisplayName("janela de mais de 62 dias é 400")
    void janelaLarga() throws Exception {
        mockMvc.perform(get("/compromissos/calendario").header(AUTHORIZATION, token)
                        .param("inicio", "2027-01-01T03:00:00Z")
                        .param("fim", "2027-04-01T03:00:00Z"))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o tenant B não vê nem altera o compromisso do A, nem usa filial ou usuário do A")
    void isolamentoEntreTenants() throws Exception {
        UUID id = criarUm(profissional.getId(), "2027-03-10T13:00:00Z", "2027-03-10T14:00:00Z");
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/compromissos/{id}", id).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/compromissos/{id}/cancelar", id).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/compromissos/calendario").header(AUTHORIZATION, tokenB)
                        .param("inicio", "2027-03-01T03:00:00Z")
                        .param("fim", "2027-04-01T03:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Filial do A com responsável do B, e filial do B com responsável do A
        UUID lojaB = criarMatriz(tokenB, salvarPessoa(tenantB, "Loja B").getId());
        mockMvc.perform(post("/compromissos").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content(jsonCom(loja, adminB.getId(), null, "2027-03-10T13:00:00Z",
                                "2027-03-10T14:00:00Z", List.of(), null)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/compromissos").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content(jsonCom(lojaB, profissional.getId(), null, "2027-03-10T13:00:00Z",
                                "2027-03-10T14:00:00Z", List.of(), null)))
                .andExpect(status().isNotFound());

        // A disponibilidade do B não revela a ocupação de um usuário do A
        mockMvc.perform(post("/compromissos/disponibilidade").header(AUTHORIZATION, tokenB)
                        .contentType("application/json")
                        .content("""
                                {"inicio":"2027-03-10T13:00:00Z","fim":"2027-03-10T14:00:00Z","responsavelId":"%s"}
                                """.formatted(profissional.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ocorrencias[0].choques", hasSize(0)));
    }

    @Test
    @DisplayName("o superadmin é responsável no próprio tenant, mas não dentro do tenant de um cliente")
    void superadminComoResponsavel() throws Exception {
        String tokenRoot = autenticar(superadmin.getEmail());
        UUID lojaRaiz = criarMatriz(tokenRoot, salvarPessoa(superadmin.getTenant(), "Sede do sistema").getId());

        // No tenant do sistema ele é usuário como outro qualquer: a tela o traz preenchido
        mockMvc.perform(post("/compromissos").header(AUTHORIZATION, tokenRoot)
                        .contentType("application/json")
                        .content(jsonCom(lojaRaiz, superadmin.getId(), null, "2027-03-10T13:00:00Z",
                                "2027-03-10T14:00:00Z", List.of(), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].responsavelId").value(superadmin.getId().toString()));

        // Dentro do tenant A ele não é usuário de lá: por isso a tela não o pré-seleciona
        String noTenantA = "Bearer " + objectMapper.readTree(mockMvc.perform(
                        post("/auth/switch-tenant/{id}", tenantA.getId()).header(AUTHORIZATION, tokenRoot))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("accessToken").asText();
        mockMvc.perform(post("/compromissos").header(AUTHORIZATION, noTenantA)
                        .contentType("application/json")
                        .content(jsonCom(loja, superadmin.getId(), null, "2027-03-10T13:00:00Z",
                                "2027-03-10T14:00:00Z", List.of(), null)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Responsável não encontrado"));
    }

    @Test
    @DisplayName("o combo de usuários é aberto a quem está logado, e só do próprio tenant")
    void comboDeUsuarios() throws Exception {
        mockMvc.perform(get("/usuarios/select").header(AUTHORIZATION, autenticar(userA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    // ─────────────────────────────────────────────────────────────────

    private UUID criarUm(UUID responsavelId, String inicio, String fim) throws Exception {
        return UUID.fromString(corpo(criar(json(responsavelId, inicio, fim, List.of(), null))
                .andExpect(status().isCreated())).get(0).get("id").asText());
    }

    private ResultActions criar(String json) throws Exception {
        return mockMvc.perform(post("/compromissos").header(AUTHORIZATION, token)
                .contentType("application/json").content(json));
    }

    private ResultActions alterar(UUID id, String json) throws Exception {
        return mockMvc.perform(put("/compromissos/{id}", id).header(AUTHORIZATION, token)
                .contentType("application/json").content(json));
    }

    private ResultActions acao(UUID id, String acao) throws Exception {
        return mockMvc.perform(patch("/compromissos/{id}/" + acao, id).header(AUTHORIZATION, token));
    }

    private ResultActions calendario(String inicio, String fim, UUID usuarioId) throws Exception {
        var req = get("/compromissos/calendario").header(AUTHORIZATION, token)
                .param("inicio", inicio).param("fim", fim);
        if (usuarioId != null) req.param("usuarioId", usuarioId.toString());
        return mockMvc.perform(req).andExpect(status().isOk());
    }

    private ResultActions disponibilidade(UUID responsavelId, String inicio, String fim, List<UUID> convidados,
                                          String recorrencia, UUID ignorarId) throws Exception {
        return mockMvc.perform(post("/compromissos/disponibilidade").header(AUTHORIZATION, token)
                .contentType("application/json")
                .content("""
                        {"inicio":"%s","fim":"%s","responsavelId":"%s","convidadoIds":%s,
                         "recorrencia":%s,"ignorarId":%s}
                        """.formatted(inicio, fim, responsavelId, ids(convidados), recorrencia,
                        ignorarId != null ? "\"" + ignorarId + "\"" : "null")));
    }

    private String json(UUID responsavelId, String inicio, String fim, List<UUID> convidados,
                        String recorrencia) throws Exception {
        return jsonCom(loja, responsavelId, cliente, inicio, fim, convidados, recorrencia);
    }

    private String jsonCom(UUID filialId, UUID responsavelId, UUID pessoaId, String inicio, String fim,
                           List<UUID> convidados, String recorrencia) throws Exception {
        return """
                {"filialId":"%s","responsavelId":"%s","pessoaId":%s,"titulo":"Consulta",
                 "inicio":"%s","fim":"%s","convidadoIds":%s,"recorrencia":%s}
                """.formatted(filialId, responsavelId, pessoaId != null ? "\"" + pessoaId + "\"" : "null",
                inicio, fim, ids(convidados), recorrencia);
    }

    private String ids(List<UUID> ids) throws Exception {
        return objectMapper.writeValueAsString(ids.stream().map(UUID::toString).toList());
    }

    /** Série com a lista da prévia; o início/fim da base é o da primeira data. */
    private String jsonSerie(UUID responsavelId, String tipo, int quantidade, String... ocorrencias) {
        return """
                {"filialId":"%s","responsavelId":"%s","titulo":"Consulta",
                 "inicio":"2027-03-10T13:00:00Z","fim":"2027-03-10T14:00:00Z","convidadoIds":[],
                 "recorrencia":%s,"ocorrencias":[%s]}
                """.formatted(loja, responsavelId, recorrencia(tipo, quantidade), String.join(",", ocorrencias));
    }

    private ResultActions disponibilidadeCom(String json) throws Exception {
        return mockMvc.perform(post("/compromissos/disponibilidade").header(AUTHORIZATION, token)
                .contentType("application/json").content(json)).andExpect(status().isOk());
    }

    private static String ocorrencia(String inicio, String fim) {
        return """
                {"inicio":"%s","fim":"%s"}""".formatted(inicio, fim);
    }

    private static String recorrencia(String tipo, int quantidade) {
        return """
                {"tipo":"%s","quantidade":%d}""".formatted(tipo, quantidade);
    }

    private UUID criarMatriz(String tokenDo, UUID pessoaId) throws Exception {
        return UUID.fromString(corpo(mockMvc.perform(post("/filiais").header(AUTHORIZATION, tokenDo)
                        .contentType("application/json")
                        .content("""
                                {"pessoaId":"%s","tipo":"MATRIZ","cor":"#3B82F6"}
                                """.formatted(pessoaId)))
                .andExpect(status().isCreated())).get("id").asText());
    }

    private JsonNode corpo(ResultActions resultado) throws Exception {
        return objectMapper.readTree(resultado.andReturn().getResponse().getContentAsString());
    }
}
