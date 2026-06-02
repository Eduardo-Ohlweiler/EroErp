package com.api.ero_erp.subgrupo.mapper;

import com.api.ero_erp.subgrupo.dtos.SubgrupoResponseDto;
import com.api.ero_erp.subgrupo.entity.Subgrupo;
import org.springframework.stereotype.Component;

@Component
public class SubgrupoMapper {

    public SubgrupoResponseDto toDto(Subgrupo s) {
        return new SubgrupoResponseDto(
                s.getId(),
                s.getCliente().getId(),
                s.getGrupo().getId(),
                s.getGrupo().getNome(),
                s.getNome(),
                s.getAtivo(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
