package com.api.ero_api.seguranca.cripto;

import com.api.ero_api.seguranca.config.SegurancaProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * Cifra campos sensíveis guardados no banco (AES-256-GCM, OWASP A04).
 *
 * <p>Formato gravado: {@code v1:base64(iv[12] + texto cifrado + tag)}. O prefixo
 * de versão permite trocar a chave no futuro sem perder o que já foi gravado.
 */
@Service
public class CriptoService {

    private static final String VERSAO = "v1:";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKey chave;
    private final SecureRandom random = new SecureRandom();

    public CriptoService(SegurancaProperties props) {
        byte[] bytes = Base64.getDecoder().decode(props.criptoChave());
        if (bytes.length != 32) {
            throw new IllegalStateException("APP_CRIPTO_CHAVE precisa ter exatamente 32 bytes em base64 (AES-256).");
        }
        this.chave = new SecretKeySpec(bytes, "AES");
    }

    public String cifrar(String texto) {
        if (texto == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, iv));
            byte[] cifrado = cipher.doFinal(texto.getBytes(StandardCharsets.UTF_8));
            byte[] saida = ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array();
            return VERSAO + Base64.getEncoder().encodeToString(saida);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao cifrar campo.", e);
        }
    }

    public String decifrar(String gravado) {
        if (gravado == null) {
            return null;
        }
        if (!gravado.startsWith(VERSAO)) {
            throw new IllegalStateException("Campo cifrado em formato desconhecido.");
        }
        try {
            byte[] entrada = Base64.getDecoder().decode(gravado.substring(VERSAO.length()));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(TAG_BITS, entrada, 0, IV_BYTES));
            byte[] texto = cipher.doFinal(entrada, IV_BYTES, entrada.length - IV_BYTES);
            return new String(texto, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao decifrar campo.", e);
        }
    }
}
