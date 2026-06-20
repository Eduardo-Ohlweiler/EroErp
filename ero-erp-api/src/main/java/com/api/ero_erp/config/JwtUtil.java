package com.api.ero_erp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

    private final Key key;
    private final Long expiration;

    public JwtUtil(
            @Value("${jwt.secret}")     String secret,
            @Value("${jwt.expiration}") Long   expiration
    ) {

        this.key        = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
    }
    //gerar token com lista de roles e id da sessão (login_log)
    public String gerar(Long id, List<String> roles, Long sessionId) {
        return Jwts.builder()
                .setSubject(id.toString())
                .claim("roles", roles)
                .claim("sessionId", sessionId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    //pegar o id
    public  Long getId(String token) {
        Claims claims = getClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    //pegar roles
    public List<String> getRoles(String token) {
        Claims claims = getClaims(token);
        return (List<String>) claims.get("roles");
    }

    //pegar id da sessão (login_log)
    public Long getSessionId(String token) {
        return extrairSessionId(getClaims(token));
    }

    //pegar id da sessão a partir das claims (inclusive de token expirado)
    public Long extrairSessionId(Claims claims) {
        Object sessionId = claims.get("sessionId");
        if (sessionId == null)
            return null;
        return ((Number) sessionId).longValue();
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}