package com.api.ero_erp.servico.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * @param filiais em ordem de nome da filial
 */
public record ServicoResponseDto(
        UUID id,
        Long codigo,
        String nome,
        String observacao,
        Boolean ativo,
        List<ServicoFilialResponseDto> filiais,
        Instant createdAt,
        Instant updatedAt
) {}
