package com.api.ero_erp.contato.dtos;

import java.util.UUID;

public record TelefoneResponseDto(
        UUID id,
        UUID tipoTelefoneId,
        String tipoTelefoneNome,
        String codigoPais,
        String numero,
        String observacao,
        Boolean principal
) {}
