package com.api.ero_api.compartilhado.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * SHA-256 para segredos de alta entropia gerados pelo sistema (refresh token,
 * código de recuperação). NÃO use para senha: senha usa Argon2 (SenhaService).
 */
public final class HashUtils {

    private HashUtils() {
    }

    public static String sha256Hex(String valor) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
