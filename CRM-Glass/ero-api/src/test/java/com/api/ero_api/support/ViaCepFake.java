package com.api.ero_api.support;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ViaCEP de mentira para os testes: um servidor HTTP local (porta livre) no lugar de
 * {@code https://viacep.com.br/ws}. Os testes nunca saem para a internet. O endereço vai
 * para {@code app.cep.url} pelo {@code IntegracaoTest}.
 *
 * <p>Cada teste programa a resposta do próprio CEP ({@link #responder}, {@link #atrasar},
 * {@link #redirecionar}); CEP não programado responde como o ViaCEP responde a um CEP
 * inexistente ({@code {"erro": "true"}}). {@link #chamadas} conta os pedidos que chegaram.
 */
public final class ViaCepFake {

    private record Resposta(int status, String corpo, long atrasoMs, String destino) {
    }

    private static final Map<String, Resposta> RESPOSTAS = new ConcurrentHashMap<>();
    private static final Map<String, AtomicInteger> CHAMADAS = new ConcurrentHashMap<>();
    private static final HttpServer SERVIDOR = iniciar();

    private ViaCepFake() {
    }

    /** Base no formato do {@code app.cep.url} ({@code .../ws}, sem barra no fim). */
    public static String url() {
        return "http://127.0.0.1:" + SERVIDOR.getAddress().getPort() + "/ws";
    }

    public static void responder(String cep, int status, String corpo) {
        RESPOSTAS.put(cep, new Resposta(status, corpo, 0, null));
    }

    /** Responde certo, mas só depois de {@code atrasoMs} (para o tempo limite do cliente). */
    public static void atrasar(String cep, long atrasoMs, String corpo) {
        RESPOSTAS.put(cep, new Resposta(200, corpo, atrasoMs, null));
    }

    /** 302 para o CEP {@code destino}: quem segue redirecionamento chama o destino também. */
    public static void redirecionar(String cep, String destino) {
        RESPOSTAS.put(cep, new Resposta(302, "", 0, destino));
    }

    /** Quantos pedidos chegaram para este CEP. */
    public static int chamadas(String cep) {
        AtomicInteger n = CHAMADAS.get(cep);
        return n == null ? 0 : n.get();
    }

    private static HttpServer iniciar() {
        try {
            HttpServer s = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
            s.setExecutor(Executors.newCachedThreadPool(r -> {
                Thread t = new Thread(r, "viacep-fake");
                t.setDaemon(true);
                return t;
            }));
            s.createContext("/ws/", ViaCepFake::atender);
            s.start();
            return s;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Caminho {@code /ws/<cep>/json/}, como o do ViaCEP. */
    private static void atender(HttpExchange troca) {
        try {
            String[] partes = troca.getRequestURI().getPath().split("/");
            String cep = partes.length > 2 ? partes[2] : "";
            CHAMADAS.computeIfAbsent(cep, k -> new AtomicInteger()).incrementAndGet();
            Resposta r = RESPOSTAS.getOrDefault(cep, new Resposta(200, "{\"erro\": \"true\"}", 0, null));
            if (r.atrasoMs() > 0) {
                dormir(r.atrasoMs());
            }
            if (r.destino() != null) {
                troca.getResponseHeaders().add("Location", "/ws/" + r.destino() + "/json/");
            }
            byte[] corpo = r.corpo().getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            troca.sendResponseHeaders(r.status(), corpo.length == 0 ? -1 : corpo.length);
            if (corpo.length > 0) {
                try (OutputStream out = troca.getResponseBody()) {
                    out.write(corpo);
                }
            }
        } catch (IOException e) {
            // O cliente já desistiu (tempo limite): não há a quem responder.
        } finally {
            troca.close();
        }
    }

    private static void dormir(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
