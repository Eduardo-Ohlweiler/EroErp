package com.api.ero_erp.crm.lembretependencia.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

public record LembretePendenciaItemDto(
        @Schema(description = "ID do lembrete (null para novos)")
        Long id,

        @Schema(description = "Tempo em horas para disparo do lembrete")
        Integer tempoHoras,

        @Schema(description = "Mensagem do lembrete")
        String mensagem,

        @Schema(description = "Ordem de exibição")
        Integer ordem
) {}
