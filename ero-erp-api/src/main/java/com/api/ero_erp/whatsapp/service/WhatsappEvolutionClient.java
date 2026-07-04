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

    public String enviar(String apiUrl, String instanceName, String apiKey, String numero, String mensagem) {
        String url = apiUrl.replaceAll("/+$", "") + "/message/sendText/" + instanceName;

        try {
            Map resposta = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(Map.of("number", numero, "text", mensagem))
                    .retrieve()
                    .body(Map.class);

            log.debug("Mensagem enviada para {} via instância {}", numero, instanceName);
            return extrairMessageId(resposta);
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

    /**
     * Envia mídia (imagem, vídeo, documento) via POST /message/sendMedia/{instance}.
     * Generaliza o enviarDocumento permitindo mediatype/mimetype/fileName/caption arbitrários.
     */
    public String enviarMidia(String apiUrl, String instanceName, String apiKey,
                              String numero, String base64, String mediatype,
                              String mimetype, String fileName, String caption) {
        String url = apiUrl.replaceAll("/+$", "") + "/message/sendMedia/" + instanceName;

        try {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("number", numero);
            body.put("mediatype", mediatype);
            if (mimetype != null && !mimetype.isBlank()) body.put("mimetype", mimetype);
            if (fileName != null && !fileName.isBlank()) body.put("fileName", fileName);
            body.put("media", base64);
            if (caption != null && !caption.isBlank())   body.put("caption", caption);

            Map resposta = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            log.debug("Mídia ({}) enviada para {} via instância {}", mediatype, numero, instanceName);
            return extrairMessageId(resposta);
        } catch (Exception e) {
            log.error("Falha ao enviar mídia WhatsApp para {}: {}", numero, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao enviar mídia: " + e.getMessage(), e);
        }
    }

    /**
     * Envia áudio (formato WhatsApp/PTT) via POST /message/sendWhatsAppAudio/{instance}.
     */
    public String enviarAudio(String apiUrl, String instanceName, String apiKey,
                              String numero, String base64) {
        String url = apiUrl.replaceAll("/+$", "") + "/message/sendWhatsAppAudio/" + instanceName;

        try {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("number", numero);
            body.put("audio", base64);

            Map resposta = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            log.debug("Áudio enviado para {} via instância {}", numero, instanceName);
            return extrairMessageId(resposta);
        } catch (Exception e) {
            log.error("Falha ao enviar áudio WhatsApp para {}: {}", numero, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao enviar áudio: " + e.getMessage(), e);
        }
    }

    /**
     * Marca mensagens como lidas (envia o "visto"/tick azul ao contato) via
     * POST /chat/markMessageAsRead/{instance}. Best-effort: loga e não propaga erro.
     */
    public void markMessageAsRead(String apiUrl, String instanceName, String apiKey,
                                  String remoteJid, String messageId, boolean fromMe) {
        String url = apiUrl.replaceAll("/+$", "") + "/chat/markMessageAsRead/" + instanceName;

        try {
            java.util.Map<String, Object> read = new java.util.HashMap<>();
            read.put("remoteJid", remoteJid);
            read.put("fromMe", fromMe);
            read.put("id", messageId);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("readMessages", java.util.List.of(read));

            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.debug("Mensagem {} marcada como lida na instância {}", messageId, instanceName);
        } catch (Exception e) {
            log.error("Falha ao marcar mensagem como lida na Evolution (instância {}): {}", instanceName, e.getMessage());
        }
    }

    /**
     * Extrai o id da mensagem (key.id) da resposta de envio da Evolution.
     * Best-effort: retorna null se qualquer nível estiver ausente — o envio em si já ocorreu.
     */
    private String extrairMessageId(Map<?, ?> resposta) {
        if (resposta == null) return null;
        Object key = resposta.get("key");
        if (key instanceof Map<?, ?> keyMap && keyMap.get("id") != null) {
            return keyMap.get("id").toString();
        }
        return null;
    }

    /**
     * Baixa o binário de uma mídia em base64 via POST /chat/getBase64FromMediaMessage/{instance}.
     * Retorna o corpo (Map) contendo tipicamente { base64, mimetype, fileName }.
     */
    public Map baixarMidiaBase64(String apiUrl, String instanceName, String apiKey,
                                 String evolutionMessageId) {
        String url = apiUrl.replaceAll("/+$", "") + "/chat/getBase64FromMediaMessage/" + instanceName;

        try {
            java.util.Map<String, Object> message = new java.util.HashMap<>();
            java.util.Map<String, Object> key = new java.util.HashMap<>();
            key.put("id", evolutionMessageId);
            message.put("key", key);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("message", message);
            body.put("convertToMp4", false);

            Map resposta = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            log.debug("Mídia baixada (messageId={}) via instância {}", evolutionMessageId, instanceName);
            return resposta;
        } catch (Exception e) {
            log.error("Falha ao baixar mídia (messageId={}) na Evolution: {}", evolutionMessageId, e.getMessage());
            throw new RuntimeException("Erro na Evolution API ao baixar mídia: " + e.getMessage(), e);
        }
    }

    /**
     * Configura o webhook da instância via POST /webhook/set/{instance}.
     * Os eventos padrão do CRM são MESSAGES_UPSERT e CONNECTION_UPDATE.
     */
    public void configurarWebhook(String apiUrl, String instanceName, String apiKey,
                                  String webhookUrl, java.util.List<String> eventos) {
        String url = apiUrl.replaceAll("/+$", "") + "/webhook/set/" + instanceName;

        try {
            java.util.Map<String, Object> webhook = new java.util.HashMap<>();
            webhook.put("enabled", true);
            webhook.put("url", webhookUrl);
            webhook.put("webhookByEvents", false);
            webhook.put("events", eventos);

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("webhook", webhook);

            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", apiKey)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.debug("Webhook configurado para instância {} → {}", instanceName, webhookUrl);
        } catch (Exception e) {
            // Não falhar o fluxo de conexão caso o webhook não possa ser configurado
            log.error("Falha ao configurar webhook da instância {}: {}", instanceName, e.getMessage());
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
