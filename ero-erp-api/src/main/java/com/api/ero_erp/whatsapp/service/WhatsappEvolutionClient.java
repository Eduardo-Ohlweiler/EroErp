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
}
