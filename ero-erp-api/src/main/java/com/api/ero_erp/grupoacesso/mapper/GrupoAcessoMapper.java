package com.api.ero_erp.grupoacesso.mapper;

import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoResponseDto;
import com.api.ero_erp.grupoacesso.entity.GrupoAcesso;
import com.api.ero_erp.role.entity.Role;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class GrupoAcessoMapper {
    public GrupoAcessoResponseDto toDTO(GrupoAcesso g) {
        return new GrupoAcessoResponseDto(
                g.getId(),
                g.getNome(),
                g.getDescricao(),
                g.getRoles()
                        .stream()
                        .map(Role::getNome)
                        .collect(Collectors.toSet())
        );
    }
}
