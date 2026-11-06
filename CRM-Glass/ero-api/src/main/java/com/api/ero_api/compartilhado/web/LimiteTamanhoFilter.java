package com.api.ero_api.compartilhado.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Limita o corpo da requisição (padrão 1 MB) — OWASP A05/A06.
 *
 * <ul>
 *   <li>Com {@code Content-Length} maior que o limite: 413 na hora, sem ler nada.</li>
 *   <li>Sem {@code Content-Length} (envio "chunked"): o corpo é contado enquanto é
 *       lido e a leitura falha ao passar do limite, então o JSON gigante nunca chega
 *       inteiro na memória (vira 400 "formato inválido").</li>
 * </ul>
 * Upload de arquivo, quando existir, terá rota e limite próprios.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class LimiteTamanhoFilter extends OncePerRequestFilter {

    private final long limiteBytes;

    public LimiteTamanhoFilter(@Value("${app.requisicao.tamanho-maximo-bytes:1048576}") long limiteBytes) {
        this.limiteBytes = limiteBytes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > limiteBytes) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            response.setContentType("application/problem+json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"title\":\"Content Too Large\",\"status\":413,\"codigo\":\"HTTP_413\","
                    + "\"detail\":\"Requisição grande demais.\",\"instance\":\"" + request.getRequestURI().replace("\"", "")
                    + "\"}");
            return;
        }
        chain.doFilter(new CorpoLimitado(request, limiteBytes), response);
    }

    /** Exceção de leitura: o Spring a transforma em "requisição em formato inválido". */
    static class CorpoGrandeDemaisException extends IOException {
        CorpoGrandeDemaisException() {
            super("Corpo da requisição maior que o limite.");
        }
    }

    private static final class CorpoLimitado extends HttpServletRequestWrapper {

        private final long limite;
        private ServletInputStream contado;

        CorpoLimitado(HttpServletRequest request, long limite) {
            super(request);
            this.limite = limite;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (contado == null) {
                contado = new Contador(super.getInputStream(), limite);
            }
            return contado;
        }

        @Override
        public BufferedReader getReader() throws IOException {
            String charset = getCharacterEncoding() == null ? StandardCharsets.UTF_8.name() : getCharacterEncoding();
            return new BufferedReader(new InputStreamReader(getInputStream(), charset));
        }
    }

    private static final class Contador extends ServletInputStream {

        private final ServletInputStream origem;
        private final long limite;
        private long lidos;

        Contador(ServletInputStream origem, long limite) {
            this.origem = origem;
            this.limite = limite;
        }

        @Override
        public int read() throws IOException {
            int b = origem.read();
            if (b != -1) {
                somar(1);
            }
            return b;
        }

        @Override
        public int read(byte[] buffer, int inicio, int tamanho) throws IOException {
            int n = origem.read(buffer, inicio, tamanho);
            if (n > 0) {
                somar(n);
            }
            return n;
        }

        private void somar(int n) throws IOException {
            lidos += n;
            if (lidos > limite) {
                throw new CorpoGrandeDemaisException();
            }
        }

        @Override
        public boolean isFinished() {
            return origem.isFinished();
        }

        @Override
        public boolean isReady() {
            return origem.isReady();
        }

        @Override
        public void setReadListener(ReadListener listener) {
            origem.setReadListener(listener);
        }
    }
}
