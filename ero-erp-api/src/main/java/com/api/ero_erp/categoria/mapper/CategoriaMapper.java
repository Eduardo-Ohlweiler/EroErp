package com.api.ero_erp.categoria.mapper;

import com.api.ero_erp.categoria.dtos.CategoriaResponseDto;
import com.api.ero_erp.categoria.entity.Categoria;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper {

    public CategoriaResponseDto toDto(Categoria c) {
        return new CategoriaResponseDto(
                c.getId(),
                c.getCliente().getId(),
                c.getNome(),
                c.getAtivo(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
