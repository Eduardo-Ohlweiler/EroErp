package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.compromisso.enums.StatusCompromisso;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Uma linha da lista de consultas: o compromisso e o total. */
public record ConsultaListaDto(
        UUID id,
        UUID compromissoId,
        String titulo,
        Instant inicio,
        Instant fim,
        StatusCompromisso status,
        UUID filialId,
        String filialNome,
        String filialCor,
        String responsavelNome,
        String pessoaNome,
        BigDecimal total
) {}
