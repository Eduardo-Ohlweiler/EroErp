package com.api.ero_erp.config;

import jakarta.servlet.http.HttpServletRequest;

/**
 * O IP do cliente — um só lugar, para o balde do rate limit e o log de
 * acesso nunca discordarem.
 *
 * <p>É o da conexão, e só ele. O {@code X-Forwarded-For} vem do cliente, que
 * escreve nele o que quiser: tomá-lo daqui dava um balde novo a cada chute de
 * senha e um IP inventado no log. Em produção a API não tem porta pública, o
 * proxy da mesma máquina sobrescreve o cabeçalho com o IP real, e o Tomcat
 * ({@code server.forward-headers-strategy: native}, confiando só em proxy de
 * loopback e rede privada) o promove a {@code remoteAddr} antes de a
 * requisição chegar aqui (docs/06, A07).
 */
public final class IpUtils {

    private IpUtils() {}

    public static String ipDe(HttpServletRequest request) {
        return request == null ? null : request.getRemoteAddr();
    }
}
