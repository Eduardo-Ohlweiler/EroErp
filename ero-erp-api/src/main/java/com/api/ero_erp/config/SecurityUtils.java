package com.api.ero_erp.config;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UsuarioRepository usuarioRepository;

    public SecurityUtils(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Long getUsuarioIdLogado() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /** Id da sessão (login_log) embutido no JWT; null se não houver contexto/sessão. */
    public Long getSessionIdLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getDetails() instanceof Long))
            return null;
        return (Long) auth.getDetails();
    }

    public Usuario getUsuarioLogado() {
        Long id = getUsuarioIdLogado();
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    }

    public Cliente getClienteLogado() {
        Usuario usuario = getUsuarioLogado();
        if (usuario.getCliente() == null)
            throw new NotFoundException("Usuário não possui cliente vinculado");
        return usuario.getCliente();
    }

    public Long getClienteIdLogado() {
        return getClienteLogado().getId();
    }
}