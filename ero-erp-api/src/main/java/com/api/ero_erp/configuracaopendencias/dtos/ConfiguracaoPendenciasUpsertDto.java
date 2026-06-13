package com.api.ero_erp.configuracaopendencias.dtos;

public record ConfiguracaoPendenciasUpsertDto(
        Integer diasAntes,
        String  notificarClientesVencimento,
        String  mensagemAviso
) {}
