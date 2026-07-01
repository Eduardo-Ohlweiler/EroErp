package com.api.ero_erp.crm.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/crm/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final WebhookService webhookService;

    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    /**
     * Endpoint público (permitAll no SecurityConfig) que recebe os eventos da Evolution.
     * Sempre responde 200 para não fazer a Evolution reenviar; erros são apenas logados.
     */
    @PostMapping("/evolution")
    public ResponseEntity<Void> evolution(@RequestBody(required = false) JsonNode payload) {
        try {
            webhookService.processar(payload);
        } catch (Exception e) {
            log.error("Erro ao processar webhook da Evolution: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }
}
