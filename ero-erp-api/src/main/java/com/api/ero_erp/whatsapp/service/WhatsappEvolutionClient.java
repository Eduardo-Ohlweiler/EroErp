package com.api.ero_erp.whatsapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class WhatsappEvolutionClient {

    private static final Logger log = LoggerFactory.getLogger(WhatsappEvolutionClient.class);

    private final RestClient restClient;

    public WhatsappEvolutionClient() {
        this.restClient = RestClient.create();
    }

    public void enviar(String apiUrl, String instanceName, String apiKey, String numero, String mensagem) {
        String url = apiUrl.replaceAll("/+$", "") + "/message/sendText/" + instanceName;

        try {
            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(Map.of("number", numero, "text", mensagem))
                    .retrieve()
                    .toBodilessEntity();

            log.debug("Mensagem enviada para {} via instância {}", numero, instanceName);
        } catch (Exception e) {
            log.error("Falha ao enviar WhatsApp para {}: {}", numero, e.getMessage());
            throw new RuntimeException("Erro na Evolution API: " + e.getMessage(), e);
        }
    }

    public void enviarDocumento(String apiUrl, String instanceName, String apiKey,
                                String numero, String base64, String fileName, String caption) {
        String url = apiUrl.replaceAll("/+$", "") + "/message/sendMedia/" + instanceName;

        try {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("number", numero);
            body.put("mediatype", "document");
            body.put("mimetype", "application/pdf");
            body.put("fileName", fileName);
            body.put("media", base64);
            if (caption != null && !caption.isBlank()) {
                body.put("caption", caption);
            }

            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.debug("Documento '{}' enviado para {} via instância {}", fileName, numero, instanceName);
        } catch (Exception e) {
            log.error("Falha ao enviar documento WhatsApp para {}: {}", numero, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao enviar documento: " + e.getMessage(), e);
        }
    }

    /**
     * Cria a instância na Evolution (idempotente). Se a instância já existir,
     * a Evolution retorna 403/409 ou mensagem de "already in use/exists" — nesse
     * caso tratamos como sucesso. Demais erros são propagados.
     */
    public void criarInstancia(String apiUrl, String instanceName, String apiKey) {
        String url = apiUrl.replaceAll("/+$", "") + "/instance/create";

        try {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("instanceName", instanceName);
            body.put("integration", "WHATSAPP-BAILEYS");
            body.put("qrcode", true);

            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.debug("Instância '{}' criada na Evolution", instanceName);
        } catch (Exception e) {
            if (instanciaJaExiste(e)) {
                log.info("Instância '{}' já existe na Evolution, prosseguindo", instanceName);
                return;
            }
            log.error("Falha ao criar instância '{}' na Evolution: {}", instanceName, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao criar instância: " + e.getMessage(), e);
        }
    }

    /**
     * Conecta a instância e retorna o corpo com base64, code e pairingCode.
     */
    public Map conectar(String apiUrl, String instanceName, String apiKey) {
        String url = apiUrl.replaceAll("/+$", "") + "/instance/connect/" + instanceName;

        try {
            Map body = restClient.get()
                    .uri(url)
                    .header("apikey", apiKey)
                    .retrieve()
                    .body(Map.class);

            log.debug("Conexão solicitada para instância '{}'", instanceName);
            return body;
        } catch (Exception e) {
            log.error("Falha ao conectar instância '{}' na Evolution: {}", instanceName, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao conectar instância: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta o estado de conexão da instância. O estado está em body.instance.state.
     */
    public Map estadoConexao(String apiUrl, String instanceName, String apiKey) {
        String url = apiUrl.replaceAll("/+$", "") + "/instance/connectionState/" + instanceName;

        try {
            Map body = restClient.get()
                    .uri(url)
                    .header("apikey", apiKey)
                    .retrieve()
                    .body(Map.class);

            log.debug("Estado de conexão consultado para instância '{}'", instanceName);
            return body;
        } catch (Exception e) {
            log.error("Falha ao consultar estado da instância '{}' na Evolution: {}", instanceName, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao consultar estado: " + e.getMessage(), e);
        }
    }

    private boolean instanciaJaExiste(Exception e) {
        if (e instanceof org.springframework.web.client.HttpClientErrorException httpError) {
            int statusCode = httpError.getStatusCode().value();
            if (statusCode == 403 || statusCode == 409) {
                return true;
            }
        }
        String msg = e.getMessage();
        if (msg == null) return false;
        String lower = msg.toLowerCase();
        return lower.contains("already in use")
                || lower.contains("already exists")
                || lower.contains("já existe");
    }
}
