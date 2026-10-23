package com.api.ero_erp.config;

import jakarta.servlet.http.HttpServletRequest;

/**
 * O que de uma requisição pode ir para o log (regra 5).
 *
 * <p>O caminho do webhook do WhatsApp carrega o segredo que é a credencial da
 * Evolution ({@code /integracoes/whatsapp/webhook/{segredo}}, docs/13): no
 * log ele vira {@code ***}. Todo log que escreve a URI passa por aqui.
 */
public final class LogSeguro {

    private static final String PREFIXO_WEBHOOK = "/integracoes/whatsapp/webhook/";

    private LogSeguro() {}

    public static String caminho(HttpServletRequest request) {
        return request == null ? null : caminho(request.getRequestURI());
    }

    static String caminho(String uri) {
        if (uri == null) return null;
        int i = uri.indexOf(PREFIXO_WEBHOOK);
        return i < 0 ? uri : uri.substring(0, i + PREFIXO_WEBHOOK.length()) + "***";
    }
}
