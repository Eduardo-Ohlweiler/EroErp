package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.EscopoCancelamento;
import jakarta.validation.constraints.Size;

/**
 * @param escopo nulo é {@code ESTE}; {@code SEGUINTES} só faz sentido em série
 */
public record CancelarCompromissoDto(
        @Size(max = 500, message = "Motivo aceita até 500 caracteres")
        String motivo,

        EscopoCancelamento escopo
) {}
