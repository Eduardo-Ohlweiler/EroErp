package com.api.ero_erp.crm.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Canal SSE por cliente (tenant). Mantém um mapa clienteId → lista de emitters ativos.
 * Eventos emitidos: "mensagem-nova", "atendimento-atualizado".
 */
@Service
public class CrmSseService {

    private static final Logger log = LoggerFactory.getLogger(CrmSseService.class);

    private static final long TIMEOUT = 30 * 60 * 1000L; // 30 min

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long clienteId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT);

        List<SseEmitter> lista = emitters.computeIfAbsent(clienteId, k -> new CopyOnWriteArrayList<>());
        lista.add(emitter);

        emitter.onCompletion(() -> remover(clienteId, emitter));
        emitter.onTimeout(()    -> remover(clienteId, emitter));
        emitter.onError(e       -> remover(clienteId, emitter));

        try {
            emitter.send(SseEmitter.event().name("conectado").data("ok"));
        } catch (IOException e) {
            remover(clienteId, emitter);
        }

        return emitter;
    }

    public void emit(Long clienteId, String evento, Object payload) {
        List<SseEmitter> lista = emitters.get(clienteId);
        if (lista == null || lista.isEmpty()) return;

        for (SseEmitter emitter : lista) {
            try {
                emitter.send(SseEmitter.event().name(evento).data(payload));
            } catch (Exception e) {
                log.debug("Emitter morto removido do cliente {}: {}", clienteId, e.getMessage());
                remover(clienteId, emitter);
            }
        }
    }

    private void remover(Long clienteId, SseEmitter emitter) {
        List<SseEmitter> lista = emitters.get(clienteId);
        if (lista != null) {
            lista.remove(emitter);
            if (lista.isEmpty()) emitters.remove(clienteId);
        }
    }
}
