package com.api.ero_erp.usuario.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.repository.RoleRepository;
import com.api.ero_erp.usuario.dtos.UsuarioCreateDto;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.mapper.UsuarioMapper;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteService    clienteService;
    private final RoleRepository    roleRepository;
    private final UsuarioMapper     usuarioMapper;
    private final PasswordEncoder   passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            ClienteService    clienteService,
            RoleRepository    roleRepository,
            UsuarioMapper     usuarioMapper,
            PasswordEncoder   passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.clienteService    = clienteService;
        this.roleRepository    = roleRepository;
        this.usuarioMapper     = usuarioMapper;
        this.passwordEncoder   = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Usuario findById(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto findByIdResponse(Long id) {
        return usuarioMapper.toDTO(this.findById(id));
    }

    @Transactional
    public UsuarioResponseDto create(Long clienteId, UsuarioCreateDto dto) {

        if (usuarioRepository.existsByEmailIgnoreCase(dto.email()))
            throw new ConflictException("Já existe usuário com esse email, verifique!");

        Cliente cliente = clienteService.findById(clienteId);

        // busca o usuário logado para setar como createdBy
        Long loggedId = getLoggedUserId();
        Usuario createdBy = loggedId != null ? this.findById(loggedId) : null;

        Set<Role> roles = new HashSet<>();
        if (dto.roleIds() != null && !dto.roleIds().isEmpty()) {
            roles = new HashSet<>(roleRepository.findAllById(dto.roleIds()));
        }

        Usuario usuario = new Usuario();
        usuario.setCliente(cliente);
        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        usuario.setTelefone(dto.telefone());
        usuario.setRoles(roles);
        usuario.setCreatedBy(createdBy);

        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDto update(Long id, UsuarioUpdateDto dto) {

        Usuario usuario = this.findById(id);

        Long loggedId = getLoggedUserId();
        Usuario updatedBy = loggedId != null ? this.findById(loggedId) : null;

        if (dto.nome() != null && !dto.nome().isBlank())
            usuario.setNome(dto.nome());

        if (dto.telefone() != null && !dto.telefone().isBlank())
            usuario.setTelefone(dto.telefone());

        if (dto.email() != null && !dto.email().isBlank()) {
            Optional<Usuario> salvo = usuarioRepository.findByEmailIgnoreCase(dto.email());
            if (salvo.isPresent() && !salvo.get().getId().equals(id))
                throw new ConflictException("Já existe outro usuário com esse email, verifique!");
            usuario.setEmail(dto.email());
        }

        if (dto.senha() != null && !dto.senha().isBlank())
            usuario.setSenha(passwordEncoder.encode(dto.senha()));

        if (dto.ativo() != null)
            usuario.setAtivo(dto.ativo());

        if (dto.roleIds() != null && !dto.roleIds().isEmpty())
            usuario.setRoles(new HashSet<>(roleRepository.findAllById(dto.roleIds())));

        usuario.setUpdatedBy(updatedBy);

        return usuarioMapper.toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void delete(Long id) {
        usuarioRepository.delete(this.findById(id));
    }

    private Long getLoggedUserId() {
        try {
            return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        } catch (Exception e) {
            return null;
        }
    }
}