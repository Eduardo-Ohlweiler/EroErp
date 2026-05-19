package com.api.ero_erp.redesocial.mapper;

import com.api.ero_erp.redesocial.dtos.RedeSocialResponseDto;
import com.api.ero_erp.redesocial.entity.RedeSocial;
import java.util.List;
import java.util.stream.Collectors;

public class RedeSocialMapper {

    public static RedeSocialResponseDto toDto(RedeSocial entity) {
        if (entity == null)
            return null;

        return new RedeSocialResponseDto(
                entity.getId(),
                entity.getPessoa()         != null ? entity.getPessoa().getId()               : null,
                entity.getTipoRedeSocial() != null ? entity.getTipoRedeSocial().getId()       : null,
                entity.getTipoRedeSocial() != null ? entity.getTipoRedeSocial().getNome()     : null,
                entity.getUsuario(),
                entity.getUrl(),
                entity.getObservacao(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<RedeSocialResponseDto> toDtoList(List<RedeSocial> entities) {
        if (entities == null)
            return List.of();
        return entities.stream()
                .map(RedeSocialMapper::toDto)
                .collect(Collectors.toList());
    }
}