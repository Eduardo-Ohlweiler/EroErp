package com.api.ero_erp.config;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
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