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
}
