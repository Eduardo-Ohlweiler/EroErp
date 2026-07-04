package com.api.ero_erp.crm.configuracaocrm.dtos;

import com.api.ero_erp.crm.lembretependencia.dtos.LembretePendenciaItemDto;

import java.util.List;

public record ConfiguracaoCrmUpsertDto(
        String  provedor,
        String  apiUrl,
        String  apiKey,
        String  instanceName,
        String  token,
        String  numero,
        Boolean ativo,
        Boolean ativarPendencias,
        Boolean enviarConfirmacaoLeitura,
        List<LembretePendenciaItemDto> lembretes
) {}
