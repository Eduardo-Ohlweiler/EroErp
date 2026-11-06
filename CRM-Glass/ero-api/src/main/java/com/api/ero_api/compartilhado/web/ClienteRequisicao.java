package com.api.ero_api.compartilhado.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * IP e navegador de quem fez a requisição atual (para sessões e auditoria).
 *
 * <p>Atrás de proxy, o IP real só é confiável com
 * {@code server.forward-headers-strategy=native} (ver application-prod.yaml):
 * nunca leia X-Forwarded-For à mão.
 */
public final class ClienteRequisicao {

    private ClienteRequisicao() {
    }

    public static String ip() {
        HttpServletRequest req = atual();
        return req == null ? null : req.getRemoteAddr();
    }

    public static String userAgent() {
        HttpServletRequest req = atual();
        if (req == null) {
            return null;
        }
        String ua = req.getHeader("User-Agent");
        return ua == null ? null : ua.substring(0, Math.min(ua.length(), 300));
    }

    private static HttpServletRequest atual() {
        return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs
                ? attrs.getRequest()
                : null;
    }
}
