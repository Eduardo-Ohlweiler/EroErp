package com.api.ero_api.auth.util;

import java.time.Duration;
import org.springframework.http.ResponseCookie;

/**
 * Cookie do refresh token: httpOnly (JavaScript não lê), Secure (só HTTPS),
 * SameSite=Strict (não vai em requisição de outro site) e path restrito a
 * {@code /api/auth} (não viaja nas outras chamadas).
 */
public final class RefreshCookie {

    public static final String NOME = "ero_refresh";
    public static final String PATH = "/api/auth";

    private RefreshCookie() {
    }

    public static ResponseCookie criar(String valor, Duration validade, boolean seguro) {
        return ResponseCookie.from(NOME, valor)
                .httpOnly(true)
                .secure(seguro)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(validade)
                .build();
    }

    public static ResponseCookie limpar(boolean seguro) {
        return ResponseCookie.from(NOME, "")
                .httpOnly(true)
                .secure(seguro)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(Duration.ZERO)
                .build();
    }
}
