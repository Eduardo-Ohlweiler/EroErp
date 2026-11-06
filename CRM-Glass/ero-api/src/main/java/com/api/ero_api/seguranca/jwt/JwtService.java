package com.api.ero_api.seguranca.jwt;

import com.api.ero_api.seguranca.config.SegurancaProperties;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

/**
 * Emite e valida os JWT da API (HS256).
 *
 * <p>Dois tipos, que um nunca serve no lugar do outro (claim {@code typ}):
 * <ul>
 *   <li>{@code acesso}: 15 min, vai no header Authorization. Claims: sub (usuário),
 *       tid (tenant de atuação), sid (sessão).</li>
 *   <li>{@code desafio-2fa}: 5 min, só serve para trocar senha correta + código
 *       2FA por uma sessão.</li>
 * </ul>
 * O token não carrega permissões: elas são lidas do banco a cada requisição.
 */
@Service
public class JwtService {

    public static final String EMISSOR = "ero-api";
    public static final String CLAIM_TIPO = "typ";
    public static final String CLAIM_TENANT = "tid";
    public static final String CLAIM_SESSAO = "sid";
    public static final String TIPO_ACESSO = "acesso";
    public static final String TIPO_DESAFIO = "desafio-2fa";

    private final SegurancaProperties props;
    private final JwtEncoder encoder;
    private final JwtDecoder decoderAcesso;
    private final JwtDecoder decoderDesafio;

    public JwtService(SegurancaProperties props) {
        this.props = props;
        SecretKey chave = chave(props.jwtSegredo());
        this.encoder = NimbusJwtEncoder.withSecretKey(chave).algorithm(MacAlgorithm.HS256).build();
        this.decoderAcesso = decoder(chave, TIPO_ACESSO);
        this.decoderDesafio = decoder(chave, TIPO_DESAFIO);
    }

    public record TokenEmitido(String token, Instant expiraEm) {
    }

    public TokenEmitido emitirAcesso(UUID usuarioId, UUID tenantId, UUID sessaoId) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(props.tokenAcesso());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISSOR)
                .subject(usuarioId.toString())
                .issuedAt(agora)
                .expiresAt(expira)
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_TIPO, TIPO_ACESSO)
                .claim(CLAIM_TENANT, tenantId.toString())
                .claim(CLAIM_SESSAO, sessaoId.toString())
                .build();
        return new TokenEmitido(codificar(claims), expira);
    }

    public TokenEmitido emitirDesafio2fa(UUID usuarioId) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(props.desafio2fa());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISSOR)
                .subject(usuarioId.toString())
                .issuedAt(agora)
                .expiresAt(expira)
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_TIPO, TIPO_DESAFIO)
                .build();
        return new TokenEmitido(codificar(claims), expira);
    }

    /** Decoder usado pelo Spring Security em toda requisição autenticada. */
    public JwtDecoder decoderAcesso() {
        return decoderAcesso;
    }

    /** Valida o token de desafio 2FA; lança JwtException se inválido/expirado. */
    public Jwt validarDesafio(String token) {
        return decoderDesafio.decode(token);
    }

    private String codificar(JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static NimbusJwtDecoder decoder(SecretKey chave, String tipo) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(chave).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> validador = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(EMISSOR),
                new JwtClaimValidator<String>(CLAIM_TIPO, tipo::equals));
        decoder.setJwtValidator(validador);
        return decoder;
    }

    private static SecretKey chave(String base64) {
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("APP_JWT_SEGREDO precisa estar em base64.", e);
        }
        if (bytes.length < 32) {
            throw new IllegalStateException("APP_JWT_SEGREDO precisa ter pelo menos 32 bytes (256 bits).");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }
}
