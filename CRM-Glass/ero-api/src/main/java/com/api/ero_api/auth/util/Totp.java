package com.api.ero_api.auth.util;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.OptionalLong;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Código de 6 dígitos que muda a cada 30 s (TOTP, RFC 6238) — o mesmo do
 * Google Authenticator, Microsoft Authenticator, 1Password etc.
 *
 * <p>Aceita o passo anterior e o seguinte (relógio do celular adiantado ou
 * atrasado) e devolve o passo usado, para impedir reutilizar o mesmo código.
 */
public final class Totp {

    public static final int DIGITOS = 6;
    public static final int PERIODO_SEGUNDOS = 30;
    private static final int JANELA = 1;
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() {
    }

    /** Segredo novo: 20 bytes aleatórios em Base32 (o que o app autenticador lê). */
    public static String gerarSegredo() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return Base32.codificar(bytes);
    }

    /**
     * @param ultimoPassoUsado último passo aceito (null se nunca usou)
     * @return o passo aceito, ou vazio se o código não confere ou já foi usado
     */
    public static OptionalLong validar(String segredoBase32, String codigo, Instant agora, Long ultimoPassoUsado) {
        if (segredoBase32 == null || codigo == null || !codigo.matches("\\d{" + DIGITOS + "}")) {
            return OptionalLong.empty();
        }
        byte[] chave = Base32.decodificar(segredoBase32);
        long passoAtual = agora.getEpochSecond() / PERIODO_SEGUNDOS;
        for (long passo = passoAtual - JANELA; passo <= passoAtual + JANELA; passo++) {
            if (ultimoPassoUsado != null && passo <= ultimoPassoUsado) {
                continue;
            }
            if (MessageDigest.isEqual(gerar(chave, passo).getBytes(), codigo.getBytes())) {
                return OptionalLong.of(passo);
            }
        }
        return OptionalLong.empty();
    }

    /** Código válido no instante informado (usado nos testes). */
    public static String codigoEm(String segredoBase32, Instant momento) {
        return gerar(Base32.decodificar(segredoBase32), momento.getEpochSecond() / PERIODO_SEGUNDOS);
    }

    private static String gerar(byte[] chave, long passo) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(chave, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(passo).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binario = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int otp = binario % (int) Math.pow(10, DIGITOS);
            return String.format("%0" + DIGITOS + "d", otp);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
