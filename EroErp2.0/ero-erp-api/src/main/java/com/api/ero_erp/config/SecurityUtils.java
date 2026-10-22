package com.api.ero_erp.config;

import com.api.ero_erp.exceptions.UnauthorizedException;
import com.api.ero_erp.tenant.entity.Tenant;
import com.api.ero_erp.tenant.repository.TenantRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UsuarioRepository usuarioRepository;
    private final TenantRepository tenantRepository;

    public UUID getTenantIdLogado() {
        return detalhes().tenantId();
    }

    public UUID getUsuarioIdLogado() {
        Authentication auth = autenticacao();
        if (!(auth.getPrincipal() instanceof UUID id))
            throw new UnauthorizedException("Sessão inválida");
        return id;
    }

    public UUID getSessionIdLogado() {
        return detalhes().sessionId();
    }

    public Role getRoleLogada() {
        return detalhes().role();
    }

    public boolean isSuperadmin() {
        return Role.SUPERADMIN.equals(getRoleLogada());
    }

    public boolean isImpersonating() {
        return detalhes().impersonating();
    }

    /**
     * A requisição tem a authority — {@code SERVICOS_LER}, por exemplo. Para o
     * service que decide o que mostra, além do {@code @PreAuthorize} do
     * controller, que decide se entra.
     */
    public boolean temAuthority(String authority) {
        return autenticacao().getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    public Usuario getUsuarioLogado() {
        return usuarioRepository.findById(getUsuarioIdLogado())
                .orElseThrow(() -> new UnauthorizedException("Sessão inválida"));
    }

    public Tenant getTenantReference() {
        return tenantRepository.getReferenceById(getTenantIdLogado());
    }

    private Authentication autenticacao() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw new UnauthorizedException("Não autenticado");
        return auth;
    }

    private AuthDetails detalhes() {
        if (!(autenticacao().getDetails() instanceof AuthDetails detalhes))
            throw new UnauthorizedException("Sessão inválida");
        return detalhes;
    }
}
