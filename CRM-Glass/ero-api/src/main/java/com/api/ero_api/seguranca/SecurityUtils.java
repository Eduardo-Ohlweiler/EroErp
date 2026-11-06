package com.api.ero_api.seguranca;

import com.api.ero_api.compartilhado.exception.AutenticacaoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.seguranca.tenant.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Quem está logado. Tudo vem do token já validado — nenhuma ida ao banco.
 *
 * <p>Não use para filtrar tenant: isso é automático ({@code @TenantId}).
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<UsuarioAutenticado> usuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth instanceof UsuarioAuthentication ua ? Optional.of(ua.getPrincipal()) : Optional.empty();
    }

    public static UsuarioAutenticado exigirUsuario() {
        return usuarioLogado().orElseThrow(() -> new AutenticacaoException("Sessão inválida ou expirada."));
    }

    public static UUID getUsuarioIdLogado() {
        return exigirUsuario().usuarioId();
    }

    public static UUID getTenantIdLogado() {
        return exigirUsuario().tenantId();
    }

    /**
     * Para escritas em dados de contratante: o superadmin precisa antes "acessar"
     * um contratante. Na visão de plataforma (ROOT) a escrita é recusada.
     */
    public static UUID exigirTenantSelecionado() {
        UUID tenantId = getTenantIdLogado();
        if (TenantContext.ROOT.equals(tenantId)) {
            throw new RegraNegocioException("Acesse um contratante antes de alterar dados dele.");
        }
        return tenantId;
    }
}
