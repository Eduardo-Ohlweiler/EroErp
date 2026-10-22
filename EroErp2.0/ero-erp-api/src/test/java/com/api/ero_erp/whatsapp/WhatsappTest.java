package com.api.ero_erp.whatsapp;

import com.api.ero_erp.AbstractIntegrationTest;
import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.whatsapp.entity.WhatsappConexao;
import com.api.ero_erp.whatsapp.enums.StatusConexao;
import com.api.ero_erp.whatsapp.evolution.DestinoEvolution;
import com.api.ero_erp.whatsapp.evolution.EstadoEvolution;
import com.api.ero_erp.whatsapp.evolution.EvolutionApi;
import com.api.ero_erp.whatsapp.evolution.QrCodeEvolution;
import com.api.ero_erp.whatsapp.service.WhatsappService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * WhatsApp: servidor global do superadmin, modo do tenant, conexão por QR e
 * webhook. A Evolution é substituída — o teste não depende de rede —, e o
 * que se confere é o que é nosso: quem vê o quê, o isolamento, o segredo do
 * webhook e a apikey cifrada de fato na coluna.
 */
@DisplayName("WhatsApp")
class WhatsappTest extends AbstractIntegrationTest {

    private static final String URL_SERVIDOR = "https://evo.exemplo.com";
    private static final String CHAVE_SERVIDOR = "chave-global-secreta-123";
    private static final String QR = "data:image/png;base64,iVBORw0KGgo=";

    @MockitoBean EvolutionApi evolution;
    @Autowired JdbcTemplate jdbc;
    @Autowired WhatsappService whatsappService;

    // ─────────────────────────────────────────────────────────────────
    //  Servidor e criptografia
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o superadmin grava o servidor; a apikey vai cifrada na coluna e não volta na resposta")
    void servidorCifrado() throws Exception {
        String corpo = mockMvc.perform(put("/integracoes/whatsapp/servidor")
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json")
                        .content(servidorJson(URL_SERVIDOR + "/", CHAVE_SERVIDOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configurado").value(true))
                .andExpect(jsonPath("$.url").value(URL_SERVIDOR))
                .andExpect(jsonPath("$.possuiApiKey").value(true))
                .andReturn().getResponse().getContentAsString();
        assertThat(corpo).doesNotContain(CHAVE_SERVIDOR).doesNotContain("\"apiKey\"");

        String crua = jdbc.queryForObject("SELECT api_key FROM whatsapp_servidor", String.class);
        assertThat(crua).startsWith("v1:").doesNotContain(CHAVE_SERVIDOR);
        // Lida pela entidade, volta a ser a chave: o converter é o mesmo nos dois sentidos
        assertThat(whatsappServidorRepository.findFirstBy().orElseThrow().getApiKey()).isEqualTo(CHAVE_SERVIDOR);
    }

    @Test
    @DisplayName("servidor: apikey obrigatória no primeiro cadastro; vazia depois mantém a gravada")
    void servidorApikeyVaziaMantem() throws Exception {
        String root = autenticar(superadmin.getEmail());
        mockMvc.perform(put("/integracoes/whatsapp/servidor").header(AUTHORIZATION, root)
                        .contentType("application/json").content(servidorJson(URL_SERVIDOR, "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Informe a apikey do servidor"));

        mockMvc.perform(put("/integracoes/whatsapp/servidor").header(AUTHORIZATION, root)
                        .contentType("application/json").content(servidorJson(URL_SERVIDOR, CHAVE_SERVIDOR)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/integracoes/whatsapp/servidor").header(AUTHORIZATION, root)
                        .contentType("application/json").content(servidorJson("https://outro.exemplo.com", "")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://outro.exemplo.com"))
                .andExpect(jsonPath("$.possuiApiKey").value(true));
        assertThat(whatsappServidorRepository.findFirstBy().orElseThrow().getApiKey()).isEqualTo(CHAVE_SERVIDOR);

        mockMvc.perform(put("/integracoes/whatsapp/servidor").header(AUTHORIZATION, root)
                        .contentType("application/json").content(servidorJson("ftp://x", "a")))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Conectar, status, desconectar
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o painel do tenant começa com uma linha vazia, sem nada do servidor para quem não é superadmin")
    void painelInicial() throws Exception {
        cadastrarServidor();
        mockMvc.perform(get("/integracoes/whatsapp").header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modo").value("TENANT"))
                .andExpect(jsonPath("$.servidorConfigurado").value(true))
                .andExpect(jsonPath("$.conexoes", hasSize(1)))
                .andExpect(jsonPath("$.conexoes[0].id").doesNotExist())
                .andExpect(jsonPath("$.conexoes[0].status").value("DESCONECTADO"))
                .andExpect(jsonPath("$.conexoes[0].instancia").doesNotExist())
                .andExpect(jsonPath("$.foraDoModo").doesNotExist())
                .andExpect(jsonPath("$.webhookConfigurado").doesNotExist());
    }

    @Test
    @DisplayName("conectar cria a conexão, a instância e devolve o QR; sem URL pública, não configura webhook")
    void conectarDevolveQr() throws Exception {
        cadastrarServidor();
        when(evolution.conectar(any(), anyString())).thenReturn(new QrCodeEvolution(QR, "ABCD-1234"));

        String corpo = mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.base64").value(QR))
                .andExpect(jsonPath("$.pairingCode").value("ABCD-1234"))
                .andExpect(jsonPath("$.conexao.status").value("AGUARDANDO_QR"))
                .andExpect(jsonPath("$.conexao.instancia").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertThat(corpo).doesNotContain(CHAVE_SERVIDOR).doesNotContain("\"apiKey\"").doesNotContain("possuiApiKey");

        WhatsappConexao conexao = whatsappConexaoRepository.findAll().getFirst();
        assertThat(conexao.getInstancia()).startsWith("ero-" + tenantA.getId().toString().substring(0, 8) + "-");
        assertThat(conexao.getWebhookSegredo()).hasSize(43);
        assertThat(conexao.getFilial()).isNull();

        ArgumentCaptor<DestinoEvolution> destino = ArgumentCaptor.forClass(DestinoEvolution.class);
        verify(evolution).criarInstancia(destino.capture(), eq(conexao.getInstancia()));
        assertThat(destino.getValue().url()).isEqualTo(URL_SERVIDOR);
        assertThat(destino.getValue().apiKey()).isEqualTo(CHAVE_SERVIDOR);
        verify(evolution, never()).configurarWebhook(any(), anyString(), anyString());

        // Conectar de novo (o QR expirou) reaproveita a mesma linha
        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isOk());
        assertThat(whatsappConexaoRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("com URL pública, o webhook aponta para o segredo da conexão")
    void conectarConfiguraWebhook() throws Exception {
        cadastrarServidor();
        when(evolution.conectar(any(), anyString())).thenReturn(new QrCodeEvolution(QR, null));
        ReflectionTestUtils.setField(whatsappService, "urlPublica", "https://erp.exemplo.com/");
        try {
            mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                            .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                            .contentType("application/json").content("{}"))
                    .andExpect(status().isOk());
        } finally {
            ReflectionTestUtils.setField(whatsappService, "urlPublica", "");
        }

        WhatsappConexao conexao = whatsappConexaoRepository.findAll().getFirst();
        verify(evolution).configurarWebhook(any(), eq(conexao.getInstancia()),
                eq("https://erp.exemplo.com/integracoes/whatsapp/webhook/" + conexao.getWebhookSegredo()));
    }

    @Test
    @DisplayName("sem servidor cadastrado, conectar recusa com 409 e não grava conexão")
    void semServidorNaoConecta() throws Exception {
        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        "O servidor do WhatsApp ainda não foi configurado. Peça ao administrador do sistema"));
        assertThat(whatsappConexaoRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("Evolution fora do ar vira 503 com a frase da tela")
    void evolutionForaDoAr() throws Exception {
        cadastrarServidor();
        doThrow(new ServicoIndisponivelException("O servidor do WhatsApp não respondeu. Tente de novo em instantes"))
                .when(evolution).criarInstancia(any(), anyString());

        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.erro").value("O servidor do WhatsApp não respondeu. Tente de novo em instantes"));
    }

    @Test
    @DisplayName("status pergunta à Evolution e grava; desconectar faz logout e limpa o número")
    void statusEDesconectar() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        String token = autenticar(adminA.getEmail());
        when(evolution.estadoConexao(any(), anyString()))
                .thenReturn(new EstadoEvolution(StatusConexao.CONECTADO, "5551999998888"));

        mockMvc.perform(get("/integracoes/whatsapp/conexoes/{id}/status", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONECTADO"))
                .andExpect(jsonPath("$.numero").value("5551999998888"))
                .andExpect(jsonPath("$.statusEm").isNotEmpty());
        assertThat(whatsappConexaoRepository.findById(id).orElseThrow().getStatus()).isEqualTo(StatusConexao.CONECTADO);

        mockMvc.perform(post("/integracoes/whatsapp/conexoes/{id}/desconectar", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DESCONECTADO"))
                .andExpect(jsonPath("$.numero").doesNotExist());
        verify(evolution).logout(any(), anyString());
        assertThat(whatsappConexaoRepository.findById(id).orElseThrow().getNumero()).isNull();
    }

    @Test
    @DisplayName("quem só lê consulta o status, mas não conecta nem desconecta")
    void leituraSoConsulta() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        conceder(userA, Tela.WHATSAPP, NivelAcesso.LEITURA);
        String token = autenticar(userA.getEmail());
        when(evolution.estadoConexao(any(), anyString())).thenReturn(new EstadoEvolution(StatusConexao.AGUARDANDO_QR, null));

        mockMvc.perform(get("/integracoes/whatsapp/conexoes/{id}/status", id).header(AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.instancia").doesNotExist());
        mockMvc.perform(post("/integracoes/whatsapp/conexoes/{id}/desconectar", id).header(AUTHORIZATION, token))
                .andExpect(status().isForbidden());
        verify(evolution, never()).logout(any(), anyString());
    }

    // ─────────────────────────────────────────────────────────────────
    //  Superadmin
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("o superadmin vê a instância e a sobrescrita; a apikey própria vai cifrada e passa a ser usada")
    void superadminSobrescreve() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        String root = superadminNoTenant(tenantA.getId());
        String instancia = whatsappConexaoRepository.findById(id).orElseThrow().getInstancia();

        mockMvc.perform(get("/integracoes/whatsapp").header(AUTHORIZATION, root))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conexoes[0].instancia").value(instancia))
                .andExpect(jsonPath("$.conexoes[0].possuiApiKey").value(false))
                .andExpect(jsonPath("$.foraDoModo", hasSize(0)))
                .andExpect(jsonPath("$.webhookConfigurado").value(false));

        String corpo = mockMvc.perform(patch("/integracoes/whatsapp/conexoes/{id}", id).header(AUTHORIZATION, root)
                        .contentType("application/json")
                        .content("""
                                {"url":"https://propria.exemplo.com/","apiKey":"chave-propria-456","ativo":true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://propria.exemplo.com"))
                .andExpect(jsonPath("$.possuiApiKey").value(true))
                .andReturn().getResponse().getContentAsString();
        assertThat(corpo).doesNotContain("chave-propria-456");

        String crua = jdbc.queryForObject("SELECT api_key FROM whatsapp_conexao WHERE id = ?", String.class, id);
        assertThat(crua).startsWith("v1:").doesNotContain("chave-propria-456");

        when(evolution.estadoConexao(any(), anyString())).thenReturn(new EstadoEvolution(StatusConexao.CONECTADO, null));
        mockMvc.perform(get("/integracoes/whatsapp/conexoes/{id}/status", id).header(AUTHORIZATION, root))
                .andExpect(status().isOk());
        ArgumentCaptor<DestinoEvolution> destino = ArgumentCaptor.forClass(DestinoEvolution.class);
        verify(evolution).estadoConexao(destino.capture(), eq(instancia));
        assertThat(destino.getValue().url()).isEqualTo("https://propria.exemplo.com");
        assertThat(destino.getValue().apiKey()).isEqualTo("chave-propria-456");

        // O ADMIN do tenant não mexe na sobrescrita
        mockMvc.perform(patch("/integracoes/whatsapp/conexoes/{id}", id).header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{\"ativo\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("conexão desativada pelo superadmin não conecta")
    void desativadaNaoConecta() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        mockMvc.perform(patch("/integracoes/whatsapp/conexoes/{id}", id)
                        .header(AUTHORIZATION, superadminNoTenant(tenantA.getId()))
                        .contentType("application/json").content("{\"ativo\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(adminA.getEmail()))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isConflict());
        assertThat(whatsappService.conexaoPara(tenantA.getId(), null)).isEmpty();
    }

    @Test
    @DisplayName("excluir apaga a instância no servidor e a linha; só o superadmin exclui")
    void excluir() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        String instancia = whatsappConexaoRepository.findById(id).orElseThrow().getInstancia();

        mockMvc.perform(delete("/integracoes/whatsapp/conexoes/{id}", id).header(AUTHORIZATION, autenticar(adminA.getEmail())))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/integracoes/whatsapp/conexoes/{id}", id)
                        .header(AUTHORIZATION, superadminNoTenant(tenantA.getId())))
                .andExpect(status().isNoContent());
        verify(evolution).excluirInstancia(any(), eq(instancia));
        assertThat(whatsappConexaoRepository.findAll()).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Modo por filial
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POR_FILIAL: uma linha por filial ativa; conectar exige a filial; a do tenant fica fora do modo")
    void modoPorFilial() throws Exception {
        UUID doTenant = conectarTenant(adminA.getEmail());
        String admin = autenticar(adminA.getEmail());
        UUID centro = criarFilial(admin, "Loja Centro");
        UUID norte = criarFilial(admin, "Loja Norte");
        String root = superadminNoTenant(tenantA.getId());

        mockMvc.perform(patch("/integracoes/whatsapp/modo").header(AUTHORIZATION, root)
                        .contentType("application/json").content("{\"modo\":\"POR_FILIAL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modo").value("POR_FILIAL"))
                .andExpect(jsonPath("$.conexoes", hasSize(2)))
                .andExpect(jsonPath("$.conexoes[0].filialNome").value("Loja Centro"))
                .andExpect(jsonPath("$.conexoes[1].filialNome").value("Loja Norte"))
                .andExpect(jsonPath("$.foraDoModo", hasSize(1)))
                .andExpect(jsonPath("$.foraDoModo[0].id").value(doTenant.toString()));

        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar").header(AUTHORIZATION, admin)
                        .contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());

        when(evolution.conectar(any(), anyString())).thenReturn(new QrCodeEvolution(QR, null));
        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar").header(AUTHORIZATION, admin)
                        .contentType("application/json").content("{\"filialId\":\"%s\"}".formatted(norte)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conexao.filialId").value(norte.toString()))
                .andExpect(jsonPath("$.conexao.filialNome").value("Loja Norte"));

        // O ADMIN não vê o que ficou fora do modo
        mockMvc.perform(get("/integracoes/whatsapp").header(AUTHORIZATION, admin))
                .andExpect(jsonPath("$.conexoes[1].status").value("AGUARDANDO_QR"))
                .andExpect(jsonPath("$.foraDoModo").doesNotExist());

        // A resolução que a fila de envio vai usar segue o modo
        assertThat(whatsappService.conexaoPara(tenantA.getId(), norte)).get()
                .extracting(c -> c.getFilial().getId()).isEqualTo(norte);
        assertThat(whatsappService.conexaoPara(tenantA.getId(), centro)).isEmpty();
        assertThat(whatsappService.conexaoPara(tenantA.getId(), null)).isEmpty();

        mockMvc.perform(patch("/integracoes/whatsapp/modo").header(AUTHORIZATION, root)
                        .contentType("application/json").content("{\"modo\":\"TENANT\"}"))
                .andExpect(status().isOk());
        assertThat(whatsappService.conexaoPara(tenantA.getId(), norte)).get()
                .extracting(WhatsappConexao::getId).isEqualTo(doTenant);
    }

    @Test
    @DisplayName("no modo TENANT, conectar por filial é recusado")
    void tenantNaoConectaPorFilial() throws Exception {
        cadastrarServidor();
        String admin = autenticar(adminA.getEmail());
        UUID filial = criarFilial(admin, "Loja");

        mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar").header(AUTHORIZATION, admin)
                        .contentType("application/json").content("{\"filialId\":\"%s\"}".formatted(filial)))
                .andExpect(status().isBadRequest());
        assertThat(whatsappConexaoRepository.findAll()).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Isolamento
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a conexão de um tenant não existe para o outro")
    void isolamentoEntreTenants() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        String tokenB = autenticar(adminB.getEmail());

        mockMvc.perform(get("/integracoes/whatsapp/conexoes/{id}/status", id).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/integracoes/whatsapp/conexoes/{id}/desconectar", id).header(AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/integracoes/whatsapp").header(AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.conexoes", hasSize(1)))
                .andExpect(jsonPath("$.conexoes[0].id").doesNotExist());
        // Nem o superadmin, no tenant B
        mockMvc.perform(delete("/integracoes/whatsapp/conexoes/{id}", id)
                        .header(AUTHORIZATION, superadminNoTenant(tenantB.getId())))
                .andExpect(status().isNotFound());

        verify(evolution, never()).estadoConexao(any(), anyString());
        verify(evolution, never()).logout(any(), anyString());
        assertThat(whatsappConexaoRepository.findAll()).hasSize(1);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Webhook
    // ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("webhook com segredo errado é 404, sem token nenhum")
    void webhookSegredoErrado() throws Exception {
        conectarTenant(adminA.getEmail());

        mockMvc.perform(post("/integracoes/whatsapp/webhook/{segredo}", "nao-existe")
                        .contentType("application/json").content(evento("open", null)))
                .andExpect(status().isNotFound());
        assertThat(whatsappConexaoRepository.findAll().getFirst().getStatus()).isEqualTo(StatusConexao.AGUARDANDO_QR);
    }

    @Test
    @DisplayName("webhook com o segredo grava o CONNECTION_UPDATE e o número; outro evento e outra instância são ignorados")
    void webhookConexao() throws Exception {
        UUID id = conectarTenant(adminA.getEmail());
        WhatsappConexao conexao = whatsappConexaoRepository.findById(id).orElseThrow();
        String caminho = "/integracoes/whatsapp/webhook/" + conexao.getWebhookSegredo();

        mockMvc.perform(post(caminho).contentType("application/json")
                        .content("""
                                {"event":"connection.update","instance":"%s",
                                 "data":{"instance":"%s","state":"open","statusReason":200,
                                         "wuid":"5551999998888@s.whatsapp.net"}}
                                """.formatted(conexao.getInstancia(), conexao.getInstancia())))
                .andExpect(status().isOk());
        WhatsappConexao conectada = whatsappConexaoRepository.findById(id).orElseThrow();
        assertThat(conectada.getStatus()).isEqualTo(StatusConexao.CONECTADO);
        assertThat(conectada.getNumero()).isEqualTo("5551999998888");

        // Evento que não é de conexão: nada muda
        mockMvc.perform(post(caminho).contentType("application/json")
                        .content("{\"event\":\"messages.upsert\",\"instance\":\"%s\",\"data\":{\"state\":\"close\"}}"
                                .formatted(conexao.getInstancia())))
                .andExpect(status().isOk());
        // Instância de outro: nada muda
        mockMvc.perform(post(caminho).contentType("application/json").content(evento("close", "ero-outra")))
                .andExpect(status().isOk());
        assertThat(whatsappConexaoRepository.findById(id).orElseThrow().getStatus()).isEqualTo(StatusConexao.CONECTADO);

        mockMvc.perform(post(caminho).contentType("application/json").content(evento("close", conexao.getInstancia())))
                .andExpect(status().isOk());
        assertThat(whatsappConexaoRepository.findById(id).orElseThrow().getStatus()).isEqualTo(StatusConexao.DESCONECTADO);
    }

    // ─────────────────────────────────────────────────────────────────
    //  Apoio
    // ─────────────────────────────────────────────────────────────────

    private void cadastrarServidor() throws Exception {
        mockMvc.perform(put("/integracoes/whatsapp/servidor")
                        .header(AUTHORIZATION, autenticar(superadmin.getEmail()))
                        .contentType("application/json").content(servidorJson(URL_SERVIDOR, CHAVE_SERVIDOR)))
                .andExpect(status().isOk());
    }

    /** Servidor cadastrado e a conexão do tenant inteiro aguardando o QR. */
    private UUID conectarTenant(String email) throws Exception {
        cadastrarServidor();
        when(evolution.conectar(any(), anyString())).thenReturn(new QrCodeEvolution(QR, null));
        String corpo = mockMvc.perform(post("/integracoes/whatsapp/conexoes/conectar")
                        .header(AUTHORIZATION, autenticar(email))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).path("conexao").path("id").asText());
    }

    private String superadminNoTenant(UUID tenantId) throws Exception {
        return "Bearer " + objectMapper.readTree(mockMvc.perform(
                        post("/auth/switch-tenant/{id}", tenantId).header(AUTHORIZATION, autenticar(superadmin.getEmail())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("accessToken").asText();
    }

    private UUID criarFilial(String token, String nome) throws Exception {
        String corpo = mockMvc.perform(post("/filiais").header(AUTHORIZATION, token)
                        .contentType("application/json")
                        .content("""
                                {"pessoaId":"%s","tipo":"MATRIZ","cor":"#3B82F6"}
                                """.formatted(salvarPessoa(tenantA, nome).getId())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(corpo).get("id").asText());
    }

    private static String servidorJson(String url, String apiKey) {
        return """
                {"url":"%s","apiKey":"%s","ativo":true}
                """.formatted(url, apiKey);
    }

    private static String evento(String estado, String instancia) {
        String campoInstancia = instancia == null ? "" : "\"instance\":\"" + instancia + "\",";
        return """
                {"event":"CONNECTION_UPDATE",%s"data":{"state":"%s"}}
                """.formatted(campoInstancia, estado);
    }
}
