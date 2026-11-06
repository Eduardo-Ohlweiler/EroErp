package com.api.ero_api.seguranca.ratelimit;

import com.api.ero_api.compartilhado.exception.MuitasRequisicoesException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Limite de requisições por IP (OWASP A07 — força bruta; A06 — abuso).
 *
 * <p>Baldes separados para login, 2FA, refresh e o resto da API. Guardados em
 * memória: com mais de uma instância atrás de balanceador, cada uma conta o seu
 * (aceitável; para limite global, trocar por Bucket4j + Redis/Postgres).
 *
 * <p>Registrado dentro da cadeia do Spring Security (ver SecurityConfig), antes
 * da autenticação.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties props;
    private final HandlerExceptionResolver resolver;
    private final Cache<String, Bucket> baldes = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofMinutes(10))
            .maximumSize(100_000)
            .build();

    public RateLimitFilter(RateLimitProperties props,
                           @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.props = props;
        this.resolver = resolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        String grupo;
        int limite;
        if (uri.startsWith("/api/auth/login")) {
            grupo = "login";
            limite = props.login();
        } else if (uri.startsWith("/api/auth/2fa/verificar")) {
            grupo = "2fa";
            limite = props.doisFatores();
        } else if (uri.startsWith("/api/auth/refresh")) {
            grupo = "refresh";
            limite = props.refresh();
        } else {
            grupo = "geral";
            limite = props.geral();
        }

        Bucket balde = baldes.get(grupo + ":" + origem(request.getRemoteAddr()), k -> novoBalde(limite));
        ConsumptionProbe probe = balde.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long segundos = Math.max(1, Duration.ofNanos(probe.getNanosToWaitForRefill()).toSeconds());
            response.setHeader("Retry-After", String.valueOf(segundos));
            resolver.resolveException(request, response, null, new MuitasRequisicoesException(
                    "Muitas tentativas. Aguarde " + segundos + " segundos e tente de novo."));
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * IPv4: o endereço. IPv6: a rede /64 (os 4 primeiros blocos) — um provedor
     * entrega uma /64 inteira por cliente, e contar endereço por endereço deixaria
     * o atacante trocar de IP à vontade.
     */
    static String origem(String ip) {
        if (ip == null || !ip.contains(":")) {
            return ip;
        }
        try {
            byte[] b = InetAddress.getByName(ip).getAddress();
            if (b.length != 16) {
                return ip;
            }
            return HexFormat.of().formatHex(b, 0, 8) + "::/64";
        } catch (UnknownHostException e) {
            return ip;
        }
    }

    private static Bucket novoBalde(int porMinuto) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(porMinuto).refillGreedy(porMinuto, Duration.ofMinutes(1)).build())
                .build();
    }
}
