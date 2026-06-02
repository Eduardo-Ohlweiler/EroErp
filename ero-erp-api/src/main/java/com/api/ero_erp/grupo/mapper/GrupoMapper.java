package com.api.ero_erp.grupo.mapper;

import com.api.ero_erp.grupo.dtos.GrupoResponseDto;
import com.api.ero_erp.grupo.entity.Grupo;
import org.springframework.stereotype.Component;

@Component
public class GrupoMapper {

    public GrupoResponseDto toDto(Grupo g) {
        return new GrupoResponseDto(
                g.getId(),
                g.getCliente().getId(),
                g.getNome(),
                g.getAtivo(),
                g.getCreatedAt(),
                g.getUpdatedAt()
        );
    }
}
