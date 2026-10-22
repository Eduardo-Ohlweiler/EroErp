package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.StatusCompromisso;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Item leve do calendário: o que o bloco mostra e o resumo ao tocar nele. */
public record CompromissoCalendarioDto(
        UUID id,
        String titulo,
        Instant inicio,
        Instant fim,
        StatusCompromisso status,
        String cor,
        UUID filialId,
        String filialNome,
        UUID responsavelId,
        String responsavelNome,
        String pessoaNome,
        List<UUID> convidadoIds,
        boolean recorrente,
        /** A consulta feita sobre ele; nulo quando não é consulta. */
        UUID consultaId
) {}
