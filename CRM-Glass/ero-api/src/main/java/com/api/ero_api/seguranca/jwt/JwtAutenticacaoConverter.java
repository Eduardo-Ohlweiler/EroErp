package com.api.ero_api.seguranca.jwt;

import com.api.ero_api.seguranca.UsuarioAuthentication;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoService;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

/** JWT já validado (assinatura, emissor, validade, tipo) → usuário da requisição. */
@Component
public class JwtAutenticacaoConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AutorizacaoService autorizacaoService;

    public JwtAutenticacaoConverter(AutorizacaoService autorizacaoService) {
        this.autorizacaoService = autorizacaoService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID usuarioId;
        UUID sessaoId;
        UUID tenantId;
        try {
            usuarioId = UUID.fromString(jwt.getSubject());
            sessaoId = UUID.fromString(jwt.getClaimAsString(JwtService.CLAIM_SESSAO));
            tenantId = UUID.fromString(jwt.getClaimAsString(JwtService.CLAIM_TENANT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new InvalidBearerTokenException("Token inválido.");
        }
        return new UsuarioAuthentication(autorizacaoService.carregar(usuarioId, sessaoId, tenantId));
    }
}
