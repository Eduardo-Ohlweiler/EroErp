package com.api.ero_api.compartilhado.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Dá um código a cada requisição (header {@code X-Correlation-Id}), coloca no log
 * (MDC) e devolve na resposta. É esse código que aparece no erro 500 para o
 * usuário informar ao suporte. Valor vindo do cliente só é aceito se for seguro.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_CHAVE = "correlationId";
    private static final Pattern FORMATO_SEGURO = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String recebido = request.getHeader(HEADER);
        String id = recebido != null && FORMATO_SEGURO.matcher(recebido).matches()
                ? recebido
                : UUID.randomUUID().toString();
        MDC.put(MDC_CHAVE, id);
        response.setHeader(HEADER, id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_CHAVE);
        }
    }
}
