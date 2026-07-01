package com.api.ero_erp.crm.fluxokanban.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record FluxoKanbanColunaItemDto(
        @Schema(description = "ID do andamento vinculado à coluna")
        @NotNull(message = "Andamento é obrigatório")
        Long andamentoId,

        @Schema(description = "Ordem da coluna no fluxo (opcional; usa o índice se ausente)")
        Integer ordem
) {}
