package com.api.ero_erp.configuracaopendencias.dtos;

public record ConfiguracaoPendenciasResponseDto(
        Long    id,
        Integer diasAntes,
        String  notificarClientesVencimento,
        String  mensagemAviso
) {}
