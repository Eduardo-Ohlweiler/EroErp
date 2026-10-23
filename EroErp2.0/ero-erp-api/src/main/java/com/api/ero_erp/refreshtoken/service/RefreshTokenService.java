package com.api.ero_erp.refreshtoken.service;

import com.api.ero_erp.config.JwtProperties;
import com.api.ero_erp.exceptions.UnauthorizedException;
import com.api.ero_erp.refreshtoken.entity.RefreshToken;
import com.api.ero_erp.refreshtoken.repository.RefreshTokenRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private static final int BYTES_DO_TOKEN = 48;

    /**
     * Quanto tempo um refresh recém-revogado pode ser reapresentado sem
     * derrubar a cadeia. Duas abas renovam em fila (navigator.locks), mas o
     * Chrome às vezes entrega à segunda o localStorage de 1 ms antes: ela
     * apresenta o token que a primeira acabou de girar, e o reuso derrubava as
     * duas. Dentro da janela, 401 com a marca e nada emitido nem revogado; fora
     * dela, o reuso de sempre. Logout e troca de senha gravam o mesmo
     * revogado_em: reapresentar logo depois também recebe a marca, mas a cadeia
     * já está toda revogada e nenhum token sai — a sessão não volta.
     */
    static final Duration TOLERANCIA_REUSO = Duration.ofSeconds(10);

    /** A frase e a marca ({@code ErroResponseDto.motivo}) da reapresentação dentro da janela. */
    public static final String SESSAO_RENOVADA_EM_OUTRA_ABA = "Sessão renovada em outra aba";
    public static final String MOTIVO_RENOVADA_EM_OUTRA_ABA = "SESSAO_RENOVADA_EM_OUTRA_ABA";

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;
    private final TransactionTemplate transacaoIndependente;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String emitir(Usuario usuario, UUID sessionId) {
        byte[] bytes = new byte[BYTES_DO_TOKEN];
        secureRandom.nextBytes(bytes);
        String valor = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = new RefreshToken();
        token.setUsuario(usuario);
        token.setSessionId(sessionId);
        token.setTokenHash(hash(valor));
        token.setExpiraEm(Instant.now().plus(jwtProperties.getRefreshTtl()));
        refreshTokenRepository.save(token);

        return valor;
    }

    @Transactional
    public RefreshToken consumir(String valor) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(valor))
                .orElseThrow(() -> new UnauthorizedException("Sessão expirada. Faça login novamente."));

        if (token.getRevogadoEm() != null) {

            UUID usuarioId = token.getUsuario().getId();

            // Revogado agora há pouco: é a outra aba, não roubo. Nada se emite
            // e nada se revoga — a aba que perdeu a corrida relê o token novo.
            if (token.getRevogadoEm().isAfter(Instant.now().minus(TOLERANCIA_REUSO))) {
                log.info("Refresh token reapresentado dentro da tolerância entre abas, usuário {}", usuarioId);
                throw new UnauthorizedException(SESSAO_RENOVADA_EM_OUTRA_ABA, MOTIVO_RENOVADA_EM_OUTRA_ABA);
            }

            transacaoIndependente.executeWithoutResult(status ->
                    refreshTokenRepository.revogarTodosDoUsuario(usuarioId, Instant.now()));

            log.warn("Refresh token reutilizado — cadeia revogada para o usuário {}", usuarioId);
            throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
        }

        if (token.getExpiraEm().isBefore(Instant.now()))
            throw new UnauthorizedException("Sessão expirada. Faça login novamente.");

        token.setRevogadoEm(Instant.now());
        refreshTokenRepository.save(token);

        return token;
    }

    @Transactional
    public void revogarTodosDoUsuario(UUID usuarioId) {
        refreshTokenRepository.revogarTodosDoUsuario(usuarioId, Instant.now());
    }

    @Transactional
    public int expurgarExpirados(Instant limite) {
        return refreshTokenRepository.expurgarExpirados(limite);
    }

    private String hash(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
