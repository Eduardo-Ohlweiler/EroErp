package com.api.ero_erp.usuario.mapper;

import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.entity.Usuario;

public class UsuarioMapper {
    public UsuarioResponseDto toDTO(Usuario usuario) {

        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getAtivo(),
                usuario.getCliente().getId(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt(),
                usuario.getCreatedBy() != null ? usuario.getCreatedBy().getId() : null,
                usuario.getUpdatedBy() != null ? usuario.getUpdatedBy().getId() : null,
                usuario.getRoles()
                        .stream()
                        .map(Role::getNome)
                        .collect(java.util.stream.Collectors.toSet())
        );
    }
}
