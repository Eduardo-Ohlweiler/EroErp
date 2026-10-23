package com.api.ero_erp.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.api.ero_erp.exceptions.ErroResponseDto;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> ROTAS_PROTEGIDAS = Set.of(
            "/auth/login",
            "/auth/refresh");

    /**
     * O webhook do WhatsApp é público, e a credencial é o segredo do caminho.
     * Um balde por IP para todos os segredos — chutar segredos diferentes
     * gasta do mesmo — e com teto próprio, porque a Evolution chama em rajada.
     */
    private static final String PREFIXO_WEBHOOK = "/integracoes/whatsapp/webhook/";

    /**
     * Balde parado por mais que isto sai do mapa. Ele se enche de novo em um
     * minuto, então depois de dois um balde novo é igual ao que saiu — o
     * expurgo não devolve tentativa a ninguém.
     */
    private static final Duration OCIOSO = Duration.ofMinutes(2);

    /** Com o mapa deste tamanho, o expurgo roda na hora, sem esperar a rotina. */
    private static final int TETO_DE_CHAVES = 100_000;

    private record Entrada(Bucket balde, AtomicLong ultimoUso) {}

    private final ObjectMapper objectMapper;
    private final ConcurrentMap<String, Entrada> baldes = new ConcurrentHashMap<>();

    @Value("${app.seguranca.rate-limit-por-minuto:5}")
    private int limitePorMinuto;

    @Value("${app.seguranca.rate-limit-webhook-por-minuto:120}")
    private int limiteWebhookPorMinuto;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !ROTAS_PROTEGIDAS.contains(uri) && !uri.startsWith(PREFIXO_WEBHOOK);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        boolean webhook = request.getRequestURI().startsWith(PREFIXO_WEBHOOK);
        Bucket balde = webhook
                ? balde(IpUtils.ipDe(request) + "|" + PREFIXO_WEBHOOK, limiteWebhookPorMinuto)
                : balde(IpUtils.ipDe(request) + "|" + request.getRequestURI(), limitePorMinuto);

        if (balde.tryConsume(1)) {
            chain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ErroResponseDto.de(
                "Muitas tentativas. Aguarde um minuto e tente novamente.",
                HttpStatus.TOO_MANY_REQUESTS.value(),
                request.getRequestURI()));
    }

    /** Sem esta rotina o mapa só cresce: uma chave por IP que já passou por aqui. */
    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    void expurgarOciosos() {
        expurgarOciosos(Instant.now());
    }

    /** Tira os baldes parados há mais de {@link #OCIOSO} em relação a {@code agora}. */
    void expurgarOciosos(Instant agora) {
        long limite = agora.minus(OCIOSO).toEpochMilli();
        baldes.values().removeIf(e -> e.ultimoUso().get() < limite);
    }

    private Bucket balde(String chave, int limite) {
        if (baldes.size() >= TETO_DE_CHAVES) expurgarOciosos(Instant.now());

        Entrada entrada = baldes.computeIfAbsent(chave,
                k -> new Entrada(novoBalde(limite), new AtomicLong(System.currentTimeMillis())));
        entrada.ultimoUso().set(System.currentTimeMillis());
        return entrada.balde();
    }

    private static Bucket novoBalde(int limite) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limite)
                        .refillIntervally(limite, Duration.ofMinutes(1))
                        .build())
                .build();
    }
}
