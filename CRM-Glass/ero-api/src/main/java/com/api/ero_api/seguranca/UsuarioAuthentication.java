package com.api.ero_api.seguranca;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/** Autenticação do Spring Security com o nosso {@link UsuarioAutenticado} como principal. */
public class UsuarioAuthentication extends AbstractAuthenticationToken {

    private final UsuarioAutenticado usuario;

    public UsuarioAuthentication(UsuarioAutenticado usuario) {
        super(usuario.authorities().stream().map(SimpleGrantedAuthority::new).toList());
        this.usuario = usuario;
        setAuthenticated(true);
    }

    @Override
    public UsuarioAutenticado getPrincipal() {
        return usuario;
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public String getName() {
        return usuario.usuarioId().toString();
    }
}
