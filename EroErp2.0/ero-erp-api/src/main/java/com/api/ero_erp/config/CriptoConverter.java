package com.api.ero_erp.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Coluna criptografada: o segredo de terceiro que o sistema precisa reler (a
 * apikey da Evolution) e por isso não pode ir para hash.
 *
 * <p>AES-256-GCM, com IV aleatório de 12 bytes por gravação e a tag de 128
 * bits que denuncia cifra adulterada. Grava {@code v1:} + base64(iv || cifra
 * || tag); o prefixo deixa trocar de algoritmo ou de chave sem adivinhar o
 * formato da linha.
 *
 * <p>A chave é {@code APP_CRIPTO_CHAVE}: 32 bytes em base64. Sem ela, ou com
 * outro tamanho, a aplicação <b>não sobe</b> — descobrir isso na primeira
 * gravação seria pior. Trocar a chave torna ilegível o que já foi gravado: as
 * apikeys precisam ser digitadas de novo.
 *
 * <p>É bean do Spring para receber a chave; o Hibernate pede o converter ao
 * contêiner do Spring. Nenhum valor, claro ou cifrado, vai para log.
 */
@Component
@Converter
public class CriptoConverter implements AttributeConverter<String, String> {

    private static final String PREFIXO = "v1:";
    private static final String ALGORITMO = "AES/GCM/NoPadding";
    private static final int TAMANHO_IV = 12;
    private static final int TAMANHO_TAG_BITS = 128;

    private final SecretKey chave;
    private final SecureRandom aleatorio = new SecureRandom();

    public CriptoConverter(@Value("${app.cripto.chave:}") String chaveBase64) {
        this.chave = chaveDe(chaveBase64);
    }

    @Override
    public String convertToDatabaseColumn(String claro) {
        if (claro == null) return null;
        try {
            byte[] iv = new byte[TAMANHO_IV];
            aleatorio.nextBytes(iv);
            Cipher cifra = Cipher.getInstance(ALGORITMO);
            cifra.init(Cipher.ENCRYPT_MODE, chave, new GCMParameterSpec(TAMANHO_TAG_BITS, iv));
            byte[] cifrado = cifra.doFinal(claro.getBytes(StandardCharsets.UTF_8));
            return PREFIXO + Base64.getEncoder().encodeToString(
                    ByteBuffer.allocate(iv.length + cifrado.length).put(iv).put(cifrado).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao criptografar", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String gravado) {
        if (gravado == null) return null;
        if (!gravado.startsWith(PREFIXO))
            throw new IllegalStateException("Coluna criptografada em formato desconhecido");
        try {
            byte[] bruto = Base64.getDecoder().decode(gravado.substring(PREFIXO.length()));
            Cipher cifra = Cipher.getInstance(ALGORITMO);
            cifra.init(Cipher.DECRYPT_MODE, chave, new GCMParameterSpec(TAMANHO_TAG_BITS, bruto, 0, TAMANHO_IV));
            byte[] claro = cifra.doFinal(bruto, TAMANHO_IV, bruto.length - TAMANHO_IV);
            return new String(claro, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            // Tag que não confere é chave trocada ou linha adulterada
            throw new IllegalStateException(
                    "Não foi possível ler um valor criptografado. A APP_CRIPTO_CHAVE mudou?", e);
        }
    }

    private static SecretKey chaveDe(String base64) {
        if (base64 == null || base64.isBlank())
            throw new IllegalStateException(
                    "APP_CRIPTO_CHAVE não definida. Gere com: openssl rand -base64 32");
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("APP_CRIPTO_CHAVE não é base64 válido");
        }
        if (bytes.length != 32)
            throw new IllegalStateException(
                    "APP_CRIPTO_CHAVE precisa de 32 bytes (tem " + bytes.length + "). Gere com: openssl rand -base64 32");
        return new SecretKeySpec(bytes, "AES");
    }
}
