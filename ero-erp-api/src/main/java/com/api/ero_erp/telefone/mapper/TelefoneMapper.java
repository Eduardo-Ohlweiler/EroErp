package com.api.ero_erp.telefone.mapper;

import com.api.ero_erp.telefone.dtos.TelefoneResponseDto;
import com.api.ero_erp.telefone.entity.Telefone;

import java.util.List;
import java.util.stream.Collectors;

public class TelefoneMapper {

    public static TelefoneResponseDto toDto(Telefone entity) {
        if (entity == null)
            return null;

        return  new TelefoneResponseDto(
                entity.getId(),
                entity.getPessoa()       != null ? entity.getPessoa().getId()           : null,
                entity.getTipoTelefone() != null ? entity.getTipoTelefone().getId()     : null,
                entity.getTipoTelefone() != null ? entity.getTipoTelefone().getNome()   : null,
                entity.getNumero(),
                entity.getObservacao(),
                entity.getPrincipal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<TelefoneResponseDto> toDtoList(List<Telefone> entities) {
        if(entities == null)
            return List.of();

        return entities.stream()
                .map(TelefoneMapper::toDto)
                .collect(Collectors.toList());
    }
}
