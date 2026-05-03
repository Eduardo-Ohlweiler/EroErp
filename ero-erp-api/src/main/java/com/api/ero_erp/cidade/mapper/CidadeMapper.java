package com.api.ero_erp.cidade.mapper;

import com.api.ero_erp.cidade.dtos.CidadeResponseDto;
import com.api.ero_erp.cidade.entity.Cidade;
import org.springframework.stereotype.Component;

@Component
public class CidadeMapper {

    public CidadeResponseDto toDTO(Cidade c) {
        return new CidadeResponseDto(
                c.getId(),
                c.getNome(),
                c.getCodigoIbge(),
                c.getAtivo(),
                c.getEstado()
        );
    }
}
