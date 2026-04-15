package com.api.ero_erp.usuario.service;

import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.mapper.UsuarioMapper;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteService    clienteService;
    private final UsuarioMapper     usuarioMapper;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            ClienteService    clienteService,
            UsuarioMapper     usuarioMapper
    ) {
        this.usuarioRepository = usuarioRepository;
        this.clienteService    = clienteService;
        this.usuarioMapper     = usuarioMapper;
    }

    @Transactional(readOnly = true)
    public Usuario findById(Long id) throws NotFoundException {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto findByIdResponse(Long id) {
        Usuario usuario = this.findById(id);
        return this.usuarioMapper.toDTO(usuario);
    }

    @Transactional
    public UsuarioResponseDto create() {

    }
}
