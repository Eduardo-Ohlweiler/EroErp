package com.api.ero_erp.compromisso.dtos;

import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import java.time.LocalDateTime;

public record CompromissoCalendarioDto(
        Long            id,
        String          titulo,
        String          cor,
        LocalDateTime inicio,
        LocalDateTime   fim,
        Boolean         cancelado,
        Boolean         concluido,
        String          pessoaNome,
        TipoRecorrencia tipoRecorrencia,
        Long            compromissoPaiId
) {}
