package com.api.ero_erp.modelodocumento.dtos;

import java.time.LocalDateTime;

public record ModeloDocumentoResponseDto(
        Long          id,
        Long          clienteId,
        String        nome,
        String        descricao,
        String        conteudo,
        Boolean       ativo,
        String        createdByNome,
        String        updatedByNome,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
