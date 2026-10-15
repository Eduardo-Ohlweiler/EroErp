package com.api.ero_erp.config;

import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    public static final String CLAIM_TENANT_ID     = "tenantId";
    public static final String CLAIM_SESSION_ID    = "sessionId";
    public static final String CLAIM_ROLE          = "role";
    public static final String CLAIM_IMPERSONATING = "impersonating";
    public static final String CLAIM_VERSAO_SESSAO = "versaoSessao";

    private final JwtProperties properties;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String gerarAccessToken(Usuario usuario, UUID tenantId,
                                   UUID sessionId, boolean impersonating) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getId().toString())
                .claim(CLAIM_TENANT_ID, tenantId.toString())
                .claim(CLAIM_SESSION_ID, sessionId != null ? sessionId.toString() : null)
                .claim(CLAIM_ROLE, usuario.getRole().name())
                .claim(CLAIM_IMPERSONATING, impersonating)
                .claim(CLAIM_VERSAO_SESSAO, usuario.getVersaoSessao())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(properties.getAccessTtl())))
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    public Claims validar(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID usuarioId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public UUID tenantId(Claims claims) {
        return UUID.fromString(claims.get(CLAIM_TENANT_ID, String.class));
    }

    public UUID sessionId(Claims claims) {
        String valor = claims.get(CLAIM_SESSION_ID, String.class);
        return valor == null ? null : UUID.fromString(valor);
    }

    public Role role(Claims claims) {
        return Role.valueOf(claims.get(CLAIM_ROLE, String.class));
    }

    /** Nulo em token sem a claim — tratado como versão diferente. */
    public Integer versaoSessao(Claims claims) {
        return claims.get(CLAIM_VERSAO_SESSAO, Integer.class);
    }

    public boolean impersonating(Claims claims) {
        return Boolean.TRUE.equals(claims.get(CLAIM_IMPERSONATING, Boolean.class));
    }
}
