package com.api.ero_erp.whatsapp.dtos;

import java.time.Instant;

/**
 * O servidor Evolution, para o superadmin. A apikey nunca sai: só se há uma.
 *
 * @param configurado falso antes do primeiro cadastro — os outros campos
 *                    vêm vazios
 */
public record ServidorResponseDto(
        boolean configurado,
        String url,
        boolean possuiApiKey,
        Boolean ativo,
        Instant updatedAt
) {}
