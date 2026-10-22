package com.api.ero_erp.whatsapp.evolution;

import com.api.ero_erp.exceptions.ServicoIndisponivelException;
import com.api.ero_erp.whatsapp.enums.StatusConexao;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * A Evolution API v2 por HTTP. Toda chamada leva o header {@code apikey}.
 *
 * <p>Timeouts de 5 s para abrir a conexão e 15 s para a resposta: o QR leva
 * alguns segundos para nascer, mas um servidor parado não pode prender a
 * tela. O antigo não tinha timeout nenhum.
 *
 * <p>Diferenças para o {@code WhatsappEvolutionClient} do antigo:
 * <ul>
 *   <li>criar a instância pergunta antes se ela existe, em vez de tratar
 *       qualquer 403 como "já existe" — o que engolia a apikey errada;</li>
 *   <li>há logout e exclusão, e o número conectado vem da Evolution;</li>
 *   <li>a falha sai com a frase da tela, e não como {@code RuntimeException}
 *       com o corpo cru da resposta.</li>
 * </ul>
 *
 * <p>O log leva a operação, a instância e o status HTTP — nunca a apikey, o
 * número ou o texto de uma mensagem (regra 5).
 */
@Component
@Slf4j
public class EvolutionHttp implements EvolutionApi {

    private static final Duration TIMEOUT_CONEXAO = Duration.ofSeconds(5);
    private static final Duration TIMEOUT_RESPOSTA = Duration.ofSeconds(15);

    /** Só o evento de conexão, por ora. As mensagens recebidas vêm com o CRM. */
    private static final List<String> EVENTOS = List.of("CONNECTION_UPDATE");

    private final RestClient http;

    public EvolutionHttp(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(TIMEOUT_CONEXAO);
        fabrica.setReadTimeout(TIMEOUT_RESPOSTA);
        this.http = builder.requestFactory(fabrica).build();
    }

    @Override
    public void criarInstancia(DestinoEvolution destino, String instancia) {
        if (existe(destino, instancia)) return;
        chamar("criar instância", instancia, () -> http.post()
                .uri(base(destino) + "/instance/create")
                .header("apikey", destino.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "instanceName", instancia,
                        "integration", "WHATSAPP-BAILEYS",
                        "qrcode", false))
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public QrCodeEvolution conectar(DestinoEvolution destino, String instancia) {
        JsonNode corpo = chamar("conectar", instancia, () -> http.get()
                .uri(base(destino) + "/instance/connect/{instancia}", instancia)
                .header("apikey", destino.apiKey())
                .retrieve()
                .body(JsonNode.class));
        return new QrCodeEvolution(texto(corpo, "base64"), texto(corpo, "pairingCode"));
    }

    @Override
    public EstadoEvolution estadoConexao(DestinoEvolution destino, String instancia) {
        JsonNode corpo;
        try {
            corpo = http.get()
                    .uri(base(destino) + "/instance/connectionState/{instancia}", instancia)
                    .header("apikey", destino.apiKey())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value())
                return new EstadoEvolution(StatusConexao.DESCONECTADO, null);
            throw traduzir("consultar estado", instancia, e);
        } catch (RestClientException e) {
            throw traduzir("consultar estado", instancia, e);
        }

        StatusConexao status = EstadoEvolution.statusDe(corpo == null ? null : corpo.path("instance").path("state").asText(null));
        String numero = status == StatusConexao.CONECTADO
                ? numeroConectado(destino, instancia)
                : null;
        return new EstadoEvolution(status, numero);
    }

    @Override
    public void configurarWebhook(DestinoEvolution destino, String instancia, String url) {
        chamar("configurar webhook", instancia, () -> http.post()
                .uri(base(destino) + "/webhook/set/{instancia}", instancia)
                .header("apikey", destino.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("webhook", Map.of(
                        "enabled", true,
                        "url", url,
                        "webhookByEvents", false,
                        "webhookBase64", false,
                        "events", EVENTOS)))
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public void logout(DestinoEvolution destino, String instancia) {
        semErroSeAusente("desconectar", instancia, () -> http.delete()
                .uri(base(destino) + "/instance/logout/{instancia}", instancia)
                .header("apikey", destino.apiKey())
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public void excluirInstancia(DestinoEvolution destino, String instancia) {
        semErroSeAusente("excluir instância", instancia, () -> http.delete()
                .uri(base(destino) + "/instance/delete/{instancia}", instancia)
                .header("apikey", destino.apiKey())
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public void enviarTexto(DestinoEvolution destino, String instancia, String numero, String texto) {
        chamar("enviar texto", instancia, () -> http.post()
                .uri(base(destino) + "/message/sendText/{instancia}", instancia)
                .header("apikey", destino.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("number", numero, "text", texto))
                .retrieve()
                .toBodilessEntity());
    }

    // ─── Apoio ────────────────────────────────────────────────────────────

    private boolean existe(DestinoEvolution destino, String instancia) {
        try {
            http.get()
                    .uri(base(destino) + "/instance/connectionState/{instancia}", instancia)
                    .header("apikey", destino.apiKey())
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) return false;
            throw traduzir("consultar instância", instancia, e);
        } catch (RestClientException e) {
            throw traduzir("consultar instância", instancia, e);
        }
    }

    /**
     * O dono da instância. Na v2 o {@code fetchInstances} devolve
     * {@code [{ownerJid, number, ...}]}; versões anteriores aninhavam em
     * {@code instance.owner}. Falhar aqui não derruba a consulta de estado: o
     * número é complemento.
     */
    private String numeroConectado(DestinoEvolution destino, String instancia) {
        try {
            JsonNode lista = http.get()
                    .uri(base(destino) + "/instance/fetchInstances?instanceName={instancia}", instancia)
                    .header("apikey", destino.apiKey())
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode item = lista != null && lista.isArray() ? lista.path(0) : lista;
            if (item == null || item.isMissingNode()) return null;
            for (String jid : new String[]{
                    texto(item, "ownerJid"), texto(item, "number"), texto(item.path("instance"), "owner")}) {
                String numero = EstadoEvolution.numeroDe(jid);
                if (numero != null) return numero;
            }
            return null;
        } catch (RestClientException e) {
            log.warn("Evolution: número da instância {} indisponível ({})", instancia, e.getClass().getSimpleName());
            return null;
        }
    }

    private <T> T chamar(String operacao, String instancia, Supplier<T> chamada) {
        try {
            return chamada.get();
        } catch (RestClientException e) {
            throw traduzir(operacao, instancia, e);
        }
    }

    /** Para o que é idempotente por natureza: 404 (não existe) e 400 (já desligada) não são erro. */
    private void semErroSeAusente(String operacao, String instancia, Supplier<?> chamada) {
        try {
            chamada.get();
        } catch (RestClientResponseException e) {
            int codigo = e.getStatusCode().value();
            if (codigo == HttpStatus.NOT_FOUND.value() || codigo == HttpStatus.BAD_REQUEST.value()) {
                log.info("Evolution: {} da instância {} já não se aplicava (HTTP {})", operacao, instancia, codigo);
                return;
            }
            throw traduzir(operacao, instancia, e);
        } catch (RestClientException e) {
            throw traduzir(operacao, instancia, e);
        }
    }

    private static ServicoIndisponivelException traduzir(String operacao, String instancia, RestClientException e) {
        if (e instanceof RestClientResponseException resposta) {
            int codigo = resposta.getStatusCode().value();
            log.warn("Evolution: {} da instância {} recusado (HTTP {})", operacao, instancia, codigo);
            if (codigo == HttpStatus.UNAUTHORIZED.value() || codigo == HttpStatus.FORBIDDEN.value())
                return new ServicoIndisponivelException(
                        "O servidor do WhatsApp recusou a chave de acesso. "
                                + "Peça ao administrador do sistema para conferir a apikey");
            return new ServicoIndisponivelException(
                    "O servidor do WhatsApp recusou a operação (HTTP " + codigo + "). Tente de novo em instantes");
        }
        log.warn("Evolution: {} da instância {} sem resposta ({})", operacao, instancia, e.getClass().getSimpleName());
        return new ServicoIndisponivelException(
                "O servidor do WhatsApp não respondeu. Tente de novo em instantes");
    }

    /** {@code https://evo.exemplo.com/} → {@code https://evo.exemplo.com}. */
    private static String base(DestinoEvolution destino) {
        return destino.url().replaceAll("/+$", "");
    }

    private static String texto(JsonNode corpo, String campo) {
        if (corpo == null) return null;
        JsonNode valor = corpo.path(campo);
        return valor.isTextual() && !valor.asText().isBlank() ? valor.asText() : null;
    }
}
