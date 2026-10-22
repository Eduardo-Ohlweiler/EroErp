package com.api.ero_erp.whatsapp.evolution;

import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.api.ero_erp.whatsapp.enums.StatusConexao;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * O {@link EvolutionHttp} contra uma Evolution de mentira, num servidor HTTP
 * local: o que se confere é o que vai no fio — caminho, método, header
 * {@code apikey} e corpo — e como as respostas da v2 são lidas. O
 * {@code WhatsappTest} mocka a interface; sem este, ninguém olharia o HTTP.
 */
@DisplayName("Evolution — o que vai e o que volta pelo HTTP")
class EvolutionHttpTest {

    private record Pedido(String metodo, String caminho, String apikey, String corpo) {}

    private record Resposta(int status, String corpo) {}

    private final ObjectMapper json = new ObjectMapper();
    private final List<Pedido> pedidos = new CopyOnWriteArrayList<>();
    private final Map<String, Resposta> respostas = new ConcurrentHashMap<>();

    private HttpServer servidor;
    private EvolutionHttp evolution;
    private DestinoEvolution destino;

    @BeforeEach
    void subir() throws IOException {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.createContext("/", troca -> {
            String caminho = troca.getRequestURI().toString();
            pedidos.add(new Pedido(troca.getRequestMethod(), caminho,
                    troca.getRequestHeaders().getFirst("apikey"),
                    new String(troca.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
            Resposta resposta = respostas.getOrDefault(troca.getRequestMethod() + " " + caminho, new Resposta(200, "{}"));
            byte[] corpo = resposta.corpo().getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json");
            troca.sendResponseHeaders(resposta.status(), corpo.length);
            troca.getResponseBody().write(corpo);
            troca.close();
        });
        servidor.start();
        evolution = new EvolutionHttp(RestClient.builder());
        // Barra no fim de propósito: a base é aparada
        destino = new DestinoEvolution("http://127.0.0.1:" + servidor.getAddress().getPort() + "/", "chave-123");
    }

    @AfterEach
    void descer() {
        servidor.stop(0);
    }

    @Test
    @DisplayName("criar instância: pergunta antes; existindo, não cria")
    void criarJaExistente() {
        evolution.criarInstancia(destino, "ero-a");

        assertThat(pedidos).singleElement().satisfies(p -> {
            assertThat(p.metodo()).isEqualTo("GET");
            assertThat(p.caminho()).isEqualTo("/instance/connectionState/ero-a");
            assertThat(p.apikey()).isEqualTo("chave-123");
        });
    }

    @Test
    @DisplayName("criar instância: 404 na pergunta cria com WHATSAPP-BAILEYS")
    void criarNova() throws Exception {
        respostas.put("GET /instance/connectionState/ero-a", new Resposta(404, "{\"status\":404}"));

        evolution.criarInstancia(destino, "ero-a");

        assertThat(pedidos).hasSize(2);
        Pedido criar = pedidos.get(1);
        assertThat(criar.metodo()).isEqualTo("POST");
        assertThat(criar.caminho()).isEqualTo("/instance/create");
        JsonNode corpo = json.readTree(criar.corpo());
        assertThat(corpo.path("instanceName").asText()).isEqualTo("ero-a");
        assertThat(corpo.path("integration").asText()).isEqualTo("WHATSAPP-BAILEYS");
    }

    @Test
    @DisplayName("apikey recusada não passa por \"já existe\": vira a frase da chave")
    void chaveRecusada() {
        respostas.put("GET /instance/connectionState/ero-a", new Resposta(401, "{\"status\":401}"));

        assertThatThrownBy(() -> evolution.criarInstancia(destino, "ero-a"))
                .isInstanceOf(ServicoIndisponivelException.class)
                .hasMessageContaining("recusou a chave de acesso");
        assertThat(pedidos).hasSize(1);
    }

    @Test
    @DisplayName("conectar lê base64 e pairingCode; já conectada volta vazio")
    void conectar() {
        respostas.put("GET /instance/connect/ero-a",
                new Resposta(200, "{\"pairingCode\":\"WZYEH1YY\",\"code\":\"2@y8eK\",\"base64\":\"data:image/png;base64,AAA\",\"count\":1}"));
        QrCodeEvolution qr = evolution.conectar(destino, "ero-a");
        assertThat(qr.base64()).isEqualTo("data:image/png;base64,AAA");
        assertThat(qr.pairingCode()).isEqualTo("WZYEH1YY");

        respostas.put("GET /instance/connect/ero-a",
                new Resposta(200, "{\"instance\":{\"instanceName\":\"ero-a\",\"state\":\"open\"}}"));
        assertThat(evolution.conectar(destino, "ero-a").jaConectada()).isTrue();
    }

    @Test
    @DisplayName("estado open traz o número do fetchInstances; instância desconhecida é desconectada")
    void estado() {
        respostas.put("GET /instance/connectionState/ero-a",
                new Resposta(200, "{\"instance\":{\"instanceName\":\"ero-a\",\"state\":\"open\"}}"));
        respostas.put("GET /instance/fetchInstances?instanceName=ero-a",
                new Resposta(200, "[{\"name\":\"ero-a\",\"ownerJid\":\"5551999998888@s.whatsapp.net\"}]"));

        EstadoEvolution estado = evolution.estadoConexao(destino, "ero-a");
        assertThat(estado.status()).isEqualTo(StatusConexao.CONECTADO);
        assertThat(estado.numero()).isEqualTo("5551999998888");

        respostas.put("GET /instance/connectionState/ero-b", new Resposta(404, "{}"));
        assertThat(evolution.estadoConexao(destino, "ero-b").status()).isEqualTo(StatusConexao.DESCONECTADO);

        respostas.put("GET /instance/connectionState/ero-c",
                new Resposta(200, "{\"instance\":{\"instanceName\":\"ero-c\",\"state\":\"connecting\"}}"));
        assertThat(evolution.estadoConexao(destino, "ero-c"))
                .isEqualTo(new EstadoEvolution(StatusConexao.AGUARDANDO_QR, null));
    }

    @Test
    @DisplayName("webhook vai no formato v2, embrulhado, só com CONNECTION_UPDATE")
    void webhook() throws Exception {
        evolution.configurarWebhook(destino, "ero-a", "https://erp.exemplo.com/integracoes/whatsapp/webhook/s3gr3d0");

        Pedido pedido = pedidos.getFirst();
        assertThat(pedido.metodo()).isEqualTo("POST");
        assertThat(pedido.caminho()).isEqualTo("/webhook/set/ero-a");
        JsonNode webhook = json.readTree(pedido.corpo()).path("webhook");
        assertThat(webhook.path("enabled").asBoolean()).isTrue();
        assertThat(webhook.path("url").asText()).endsWith("/webhook/s3gr3d0");
        assertThat(webhook.path("events")).hasSize(1);
        assertThat(webhook.path("events").get(0).asText()).isEqualTo("CONNECTION_UPDATE");
    }

    @Test
    @DisplayName("logout e exclusão de instância já ausente não são erro")
    void idempotentes() {
        respostas.put("DELETE /instance/logout/ero-a", new Resposta(400, "{\"status\":400}"));
        respostas.put("DELETE /instance/delete/ero-a", new Resposta(404, "{\"status\":404}"));

        evolution.logout(destino, "ero-a");
        evolution.excluirInstancia(destino, "ero-a");

        assertThat(pedidos).extracting(Pedido::caminho)
                .containsExactly("/instance/logout/ero-a", "/instance/delete/ero-a");
    }

    @Test
    @DisplayName("enviar texto manda {number, text}, o formato da v2")
    void enviarTexto() throws Exception {
        evolution.enviarTexto(destino, "ero-a", "5551999998888", "Olá");

        Pedido pedido = pedidos.getFirst();
        assertThat(pedido.caminho()).isEqualTo("/message/sendText/ero-a");
        JsonNode corpo = json.readTree(pedido.corpo());
        assertThat(corpo.path("number").asText()).isEqualTo("5551999998888");
        assertThat(corpo.path("text").asText()).isEqualTo("Olá");
    }

    @Test
    @DisplayName("servidor fora do ar vira a frase de indisponível")
    void foraDoAr() {
        servidor.stop(0);

        assertThatThrownBy(() -> evolution.conectar(destino, "ero-a"))
                .isInstanceOf(ServicoIndisponivelException.class)
                .hasMessage("O servidor do WhatsApp não respondeu. Tente de novo em instantes");
    }

    @Test
    @DisplayName("número do jid: tira o domínio e o aparelho")
    void numeroDoJid() {
        assertThat(EstadoEvolution.numeroDe("5551999998888@s.whatsapp.net")).isEqualTo("5551999998888");
        assertThat(EstadoEvolution.numeroDe("5551999998888:12@s.whatsapp.net")).isEqualTo("5551999998888");
        assertThat(EstadoEvolution.numeroDe("")).isNull();
        assertThat(EstadoEvolution.numeroDe(null)).isNull();
    }
}
