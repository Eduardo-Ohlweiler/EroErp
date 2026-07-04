package com.api.ero_erp.crm.configuracaocrm.dtos;

import com.api.ero_erp.crm.lembretependencia.dtos.LembretePendenciaResponseDto;

import java.util.List;

public record ConfiguracaoCrmResponseDto(
        Long    id,
        String  provedor,
        String  apiUrl,
        String  instanceName,
        String  numero,
        Boolean ativo,
        boolean possuiApiKey,
        boolean possuiToken,
        Boolean ativarPendencias,
        Boolean enviarConfirmacaoLeitura,
        List<LembretePendenciaResponseDto> lembretes
) {}
