package com.api.ero_erp.crm.webhook;

import com.api.ero_erp.crm.atendimento.entity.Atendimento;
import com.api.ero_erp.crm.atendimento.entity.Mensagem;
import com.api.ero_erp.crm.atendimento.enums.DirecaoMensagem;
import com.api.ero_erp.crm.atendimento.enums.TipoMensagem;
import com.api.ero_erp.crm.atendimento.mapper.AtendimentoMapper;
import com.api.ero_erp.crm.atendimento.mapper.MensagemMapper;
import com.api.ero_erp.crm.atendimento.repository.AtendimentoRepository;
import com.api.ero_erp.crm.atendimento.repository.MensagemRepository;
import com.api.ero_erp.crm.atendimento.service.AtendimentoService;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import com.api.ero_erp.crm.configuracaocrm.repository.ConfiguracaoCrmRepository;
import com.api.ero_erp.crm.sse.CrmSseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Processa os webhooks recebidos da Evolution API.
 * Tolerante à variação de estrutura do JSON: navega via JsonNode com proteção contra nulls.
 */
@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final ConfiguracaoCrmRepository configuracaoCrmRepository;
    private final AtendimentoRepository     atendimentoRepository;
    private final MensagemRepository        mensagemRepository;
    private final AtendimentoService        atendimentoService;
    private final CrmSseService             sseService;

    public WebhookService(
            ConfiguracaoCrmRepository configuracaoCrmRepository,
            AtendimentoRepository     atendimentoRepository,
            MensagemRepository        mensagemRepository,
            AtendimentoService        atendimentoService,
            CrmSseService             sseService
    ) {
        this.configuracaoCrmRepository = configuracaoCrmRepository;
        this.atendimentoRepository     = atendimentoRepository;
        this.mensagemRepository        = mensagemRepository;
        this.atendimentoService        = atendimentoService;
        this.sseService                = sseService;
    }

    @Transactional
    public void processar(JsonNode payload) {
        if (payload == null || payload.isNull()) return;

        String evento = texto(payload, "event");
        String instance = texto(payload, "instance");

        if (evento == null) {
            log.debug("Webhook sem 'event', ignorando");
            return;
        }

        // Evolution envia "messages.upsert"/"MESSAGES_UPSERT" (mensagem nova)
        // e "messages.update"/"MESSAGES_UPDATE" (mudança de status: entregue/lido)
        String eventoNorm = evento.toLowerCase().replace("_", ".");
        boolean isUpsert = eventoNorm.contains("messages.upsert");
        boolean isUpdate = eventoNorm.contains("messages.update");

        if (!isUpsert && !isUpdate) {
            // connection.update e demais eventos: sem ação por ora
            log.debug("Webhook evento '{}' ignorado", evento);
            return;
        }

        if (instance == null || instance.isBlank()) {
            log.warn("Webhook '{}' sem 'instance', ignorando", evento);
            return;
        }

        ConfiguracaoCrm config = configuracaoCrmRepository.findByInstanceName(instance).orElse(null);
        if (config == null || config.getCliente() == null) {
            log.warn("Webhook: nenhuma configuração CRM para instance '{}'", instance);
            return;
        }
        Long clienteId = config.getCliente().getId();

        // O node "data" pode ser um objeto único ou um array
        JsonNode data = payload.get("data");
        if (data == null || data.isNull()) {
            log.debug("Webhook '{}' sem 'data'", evento);
            return;
        }

        if (data.isArray()) {
            for (JsonNode item : data) {
                if (isUpsert) processarMensagem(config, clienteId, item);
                else          processarStatus(config, clienteId, item);
            }
        } else {
            if (isUpsert) processarMensagem(config, clienteId, data);
            else          processarStatus(config, clienteId, data);
        }
    }

    private void processarMensagem(ConfiguracaoCrm config, Long clienteId, JsonNode data) {
        if (data == null || data.isNull()) return;

        JsonNode key = data.get("key");

        // fromMe: só processamos mensagens recebidas do cliente (inbound)
        boolean fromMe = booleano(key, "fromMe") || booleano(data, "fromMe");
        if (fromMe) {
            log.debug("Webhook: mensagem fromMe, ignorada (echo do envio)");
            return;
        }

        String evolutionMessageId = key != null ? texto(key, "id") : null;

        // dedup
        if (evolutionMessageId != null && !evolutionMessageId.isBlank()
                && mensagemRepository.existsByEvolutionMessageId(evolutionMessageId)) {
            log.debug("Webhook: mensagem {} já processada (dedup)", evolutionMessageId);
            return;
        }

        String remoteJid = key != null ? texto(key, "remoteJid") : null;
        String numero    = extrairNumero(remoteJid);
        if (numero == null || numero.isBlank()) {
            log.warn("Webhook: não foi possível extrair número (remoteJid='{}')", remoteJid);
            return;
        }

        // ignora grupos
        if (remoteJid != null && remoteJid.contains("@g.us")) {
            log.debug("Webhook: mensagem de grupo ignorada ({})", remoteJid);
            return;
        }

        String pushName = texto(data, "pushName");

        JsonNode message = data.get("message");
        TipoMensagem tipo = detectarTipo(message);
        String conteudo   = extrairConteudo(message, tipo);

        // acha ou cria atendimento aberto (mensagem recebida: sem dono, auto-vínculo por telefone)
        Atendimento atendimento = atendimentoService.acharOuCriarAtendimento(
                config, clienteId, numero, pushName, null, null);
        boolean novo = atendimento.getId() == null;

        // o remoteJid é a identidade autoritativa do WhatsApp: se o atendimento foi criado
        // com a outra variante do nono dígito (ex.: número do cadastro), converge para o JID
        // — garante envios/confirmações de leitura no formato que o WhatsApp reconhece.
        if (!numero.equals(atendimento.getNumero())) {
            atendimento.setNumero(numero);
        }

        if (novo || (pushName != null && !pushName.isBlank() && atendimento.getContatoNome() == null)) {
            if (pushName != null && !pushName.isBlank()) atendimento.setContatoNome(pushName);
        }

        LocalDateTime agora = LocalDateTime.now();
        atendimento.setDataUltimaMensagem(agora);
        atendimento.setDataUltimaMensagemCliente(agora);
        atendimento.setUltimoLembreteHoras(0); // reset do ciclo de pendências
        int naoLidas = atendimento.getMensagensNaoLidas() != null ? atendimento.getMensagensNaoLidas() : 0;
        atendimento.setMensagensNaoLidas(naoLidas + 1);
        Atendimento salvoAtendimento = atendimentoRepository.save(atendimento);

        Mensagem mensagem = new Mensagem();
        mensagem.setCliente(config.getCliente());
        mensagem.setAtendimento(salvoAtendimento);
        mensagem.setDirecao(DirecaoMensagem.RECEBIDA);
        mensagem.setTipo(tipo);
        mensagem.setConteudo(conteudo);
        mensagem.setMidiaMimetype(extrairMimetype(message));
        mensagem.setEvolutionMessageId(evolutionMessageId);
        mensagem.setDataMensagem(agora);
        Mensagem salvaMensagem = mensagemRepository.save(mensagem);

        // emite SSE
        sseService.emit(clienteId, "mensagem-nova", MensagemMapper.toDto(salvaMensagem));
        sseService.emit(clienteId, "atendimento-atualizado", AtendimentoMapper.toDto(salvoAtendimento));

        log.info("Webhook: mensagem RECEBIDA de {} (atendimento {}, novo={})",
                numero, salvoAtendimento.getId(), novo);
    }

    /**
     * Trata o evento messages.update: atualiza o status (ENTREGUE/LIDA) de uma mensagem ENVIADA
     * e emite SSE para o front atualizar os checks ao vivo.
     */
    private void processarStatus(ConfiguracaoCrm config, Long clienteId, JsonNode data) {
        if (data == null || data.isNull()) return;

        JsonNode key = data.get("key");
        String evolutionMessageId = key != null ? texto(key, "id") : texto(data, "keyId");
        String novoStatus = mapearStatus(data);
        log.info("Webhook messages.update recebido: id={} statusMapeado={}", evolutionMessageId, novoStatus);

        if (evolutionMessageId == null || evolutionMessageId.isBlank()) return;
        if (novoStatus == null) {
            log.info("Webhook messages.update sem status reconhecido: {}", data);
            return;
        }

        Mensagem mensagem = mensagemRepository
                .findFirstByEvolutionMessageIdAndDirecao(evolutionMessageId, DirecaoMensagem.ENVIADA)
                .orElse(null);
        if (mensagem == null) {
            log.info("Webhook messages.update: mensagem ENVIADA {} não encontrada", evolutionMessageId);
            return; // update de mensagem que não é nossa/enviada
        }

        // forward-only: nunca regride (ex.: DELIVERY tardio chegando depois do READ)
        if (rankStatus(novoStatus) <= rankStatus(mensagem.getStatus())) return;

        mensagem.setStatus(novoStatus);
        Mensagem salva = mensagemRepository.save(mensagem);

        sseService.emit(clienteId, "mensagem-atualizada", MensagemMapper.toDto(salva));
        log.info("Webhook: status da mensagem {} -> {}", evolutionMessageId, novoStatus);
    }

    /**
     * Mapeia o ack do WhatsApp (string SERVER_ACK/DELIVERY_ACK/READ/PLAYED ou numérico 2..5,
     * em data.status ou data.update.status) para o status interno. Null se não reconhecido.
     */
    private String mapearStatus(JsonNode data) {
        String statusStr = texto(data, "status");
        if (statusStr == null) {
            JsonNode update = data.get("update");
            statusStr = update != null ? texto(update, "status") : null;
        }
        if (statusStr == null) return null;

        String s = statusStr.trim().toUpperCase();
        return switch (s) {
            case "SERVER_ACK", "2"          -> "ENVIADA";
            case "DELIVERY_ACK", "3"        -> "ENTREGUE";
            case "READ", "PLAYED", "4", "5" -> "LIDA";
            default                          -> null;
        };
    }

    private int rankStatus(String status) {
        if (status == null) return 0;
        return switch (status) {
            case "ENVIADA"  -> 1;
            case "ENTREGUE" -> 2;
            case "LIDA"     -> 3;
            default          -> 0;
        };
    }

    // ----------------------------------------------------------------- parsing helpers

    private String extrairNumero(String remoteJid) {
        if (remoteJid == null) return null;
        // formato "5511999998888@s.whatsapp.net"
        int at = remoteJid.indexOf('@');
        String base = at > 0 ? remoteJid.substring(0, at) : remoteJid;
        // remove sufixos de device (":12") caso existam
        int colon = base.indexOf(':');
        if (colon > 0) base = base.substring(0, colon);
        return base.replaceAll("[^0-9]", "");
    }

    private TipoMensagem detectarTipo(JsonNode message) {
        if (message == null || message.isNull()) return TipoMensagem.TEXTO;
        if (message.has("imageMessage"))    return TipoMensagem.IMAGEM;
        if (message.has("audioMessage"))    return TipoMensagem.AUDIO;
        if (message.has("videoMessage"))    return TipoMensagem.VIDEO;
        if (message.has("documentMessage")) return TipoMensagem.DOCUMENTO;
        return TipoMensagem.TEXTO;
    }

    private String extrairConteudo(JsonNode message, TipoMensagem tipo) {
        if (message == null || message.isNull()) return null;
        switch (tipo) {
            case TEXTO -> {
                String conv = texto(message, "conversation");
                if (conv != null) return conv;
                JsonNode ext = message.get("extendedTextMessage");
                if (ext != null) return texto(ext, "text");
                return null;
            }
            case IMAGEM    -> { return caption(message.get("imageMessage")); }
            case VIDEO     -> { return caption(message.get("videoMessage")); }
            case DOCUMENTO -> {
                JsonNode doc = message.get("documentMessage");
                String cap = caption(doc);
                if (cap != null) return cap;
                return doc != null ? texto(doc, "fileName") : null;
            }
            default -> { return null; }
        }
    }

    private String extrairMimetype(JsonNode message) {
        if (message == null || message.isNull()) return null;
        for (String campo : new String[]{"imageMessage", "audioMessage", "videoMessage", "documentMessage"}) {
            JsonNode m = message.get(campo);
            if (m != null && !m.isNull()) {
                return texto(m, "mimetype");
            }
        }
        return null;
    }

    private String caption(JsonNode node) {
        return node != null ? texto(node, "caption") : null;
    }

    private String texto(JsonNode node, String campo) {
        if (node == null || node.isNull()) return null;
        JsonNode v = node.get(campo);
        return v != null && !v.isNull() ? v.asText() : null;
    }

    private boolean booleano(JsonNode node, String campo) {
        if (node == null || node.isNull()) return false;
        JsonNode v = node.get(campo);
        return v != null && v.asBoolean(false);
    }
}
