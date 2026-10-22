package com.api.ero_erp.whatsapp.controller;

import com.api.ero_erp.whatsapp.service.WhatsappService;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Onde a Evolution avisa. Rota pública ({@code permitAll} no
 * {@code SecurityConfig}) com rate limit no {@code RateLimitFilter}: a
 * credencial é o segredo do caminho, um por conexão, e segredo que não existe
 * responde 404. O antigo recebia em rota fixa, sem segredo nenhum.
 */
@RestController
@RequestMapping("/integracoes/whatsapp/webhook")
@RequiredArgsConstructor
@Tag(name = "WhatsApp")
public class WhatsappWebhookController {

    private final WhatsappService whatsappService;

    @PostMapping("/{segredo}")
    @Operation(summary = "Evento da Evolution", description = "Só `CONNECTION_UPDATE` é tratado.")
    public ResponseEntity<Void> receber(@PathVariable String segredo, @RequestBody(required = false) JsonNode corpo) {
        whatsappService.webhook(segredo, corpo);
        return ResponseEntity.ok().build();
    }
}
