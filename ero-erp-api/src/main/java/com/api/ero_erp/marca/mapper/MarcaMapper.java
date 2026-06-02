package com.api.ero_erp.marca.mapper;

import com.api.ero_erp.marca.dtos.MarcaResponseDto;
import com.api.ero_erp.marca.entity.Marca;
import org.springframework.stereotype.Component;

@Component
public class MarcaMapper {

    public MarcaResponseDto toDto(Marca m) {
        return new MarcaResponseDto(
                m.getId(),
                m.getCliente().getId(),
                m.getNome(),
                m.getAtivo(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
