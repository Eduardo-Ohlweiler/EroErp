package com.api.ero_erp.email.mapper;

import com.api.ero_erp.email.dtos.EmailResponseDto;
import com.api.ero_erp.email.entity.Email;

import java.util.List;
import java.util.stream.Collectors;

public class EmailMapper {
    public static EmailResponseDto toDto(Email entity) {
        if (entity == null)
            return null;

        return new EmailResponseDto(
                entity.getId(),
                entity.getCliente()   != null ? entity.getCliente().getId()       : null,
                entity.getPessoa()    != null ? entity.getPessoa().getId()        : null,
                entity.getTipoEmail() != null ? entity.getTipoEmail().getId()     : null,
                entity.getTipoEmail() != null ? entity.getTipoEmail().getNome()   : null,
                entity.getEmail(),
                entity.getObservacao(),
                entity.getPrincipal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<EmailResponseDto> toDtoList(List<Email> entities) {
        if (entities == null)
            return List.of();

        return entities.stream()
                .map(EmailMapper::toDto)
                .collect(Collectors.toList());
    }
}
