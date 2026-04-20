package com.api.ero_erp.usuario.mapper;

import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.entity.Usuario;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UsuarioMapper {
    public UsuarioResponseDto toDTO(Usuario u) {
        return new UsuarioResponseDto(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getTelefone(),
                u.getAtivo(),
                u.getCliente() != null ? u.getCliente().getId() : null,
                u.getCreatedAt(),
                u.getUpdatedAt(),
                u.getCreatedBy() != null ? u.getCreatedBy().getId()   : null,
                u.getCreatedBy() != null ? u.getCreatedBy().getNome() : null,  // ← adiciona
                u.getUpdatedBy() != null ? u.getUpdatedBy().getId()   : null,
                u.getUpdatedBy() != null ? u.getUpdatedBy().getNome() : null,  // ← adiciona
                u.getRoles()
                        .stream()
                        .map(Role::getNome)
                        .collect(Collectors.toSet())
        );
    }
}
