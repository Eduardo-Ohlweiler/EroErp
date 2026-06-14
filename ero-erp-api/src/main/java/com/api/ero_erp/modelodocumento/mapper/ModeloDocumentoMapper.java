package com.api.ero_erp.modelodocumento.mapper;

import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoResponseDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoSelectDto;
import com.api.ero_erp.modelodocumento.entity.ModeloDocumento;

public class ModeloDocumentoMapper {

    private ModeloDocumentoMapper() {}

    public static ModeloDocumentoResponseDto toDto(ModeloDocumento m) {
        return new ModeloDocumentoResponseDto(
                m.getId(),
                m.getCliente().getId(),
                m.getNome(),
                m.getDescricao(),
                m.getConteudo(),
                m.getAtivo(),
                m.getCreatedBy() != null ? m.getCreatedBy().getNome() : null,
                m.getUpdatedBy() != null ? m.getUpdatedBy().getNome() : null,
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }

    public static ModeloDocumentoSelectDto toSelectDto(ModeloDocumento m) {
        return new ModeloDocumentoSelectDto(m.getId(), m.getNome());
    }
}
