package com.api.ero_erp.auxiliarproduto.dtos;

import java.time.Instant;
import java.util.UUID;

/**
 * @param grupoAtivo o grupo pode ter sido inativado depois; a tela sinaliza,
 *                   e o combo do produto deixa de oferecer o subgrupo
 */
public record SubgrupoResponseDto(
        UUID id,
        UUID grupoId,
        String grupoNome,
        Boolean grupoAtivo,
        String nome,
        Boolean ativo,
        Instant createdAt,
        Instant updatedAt
) {}
