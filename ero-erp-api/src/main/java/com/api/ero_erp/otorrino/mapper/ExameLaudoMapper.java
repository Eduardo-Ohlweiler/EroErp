package com.api.ero_erp.otorrino.mapper;

import com.api.ero_erp.otorrino.dto.ExameLaudoResponseDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoSummaryDto;
import com.api.ero_erp.otorrino.entity.ExameLaudo;

/** Mapper utilitário (estático) para a entidade ExameLaudo. */
public final class ExameLaudoMapper {

    private ExameLaudoMapper() {
    }

    public static ExameLaudoResponseDto toResponseDto(ExameLaudo e) {
        return new ExameLaudoResponseDto(
                e.getId(),
                e.getPessoa().getId(),
                e.getPessoa().getNome(),
                e.getUsuario() != null ? e.getUsuario().getId() : null,
                e.getUsuario() != null ? e.getUsuario().getNome() : null,
                e.getConsulta() != null ? e.getConsulta().getId() : null,
                e.getDataExame(),
                e.getTipoExame() != null ? e.getTipoExame().name() : null,
                e.getLaudo(),
                e.getConclusao(),
                e.getCid(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public static ExameLaudoSummaryDto toSummaryDto(ExameLaudo e) {
        return new ExameLaudoSummaryDto(
                e.getId(),
                e.getPessoa().getId(),
                e.getPessoa().getNome(),
                e.getDataExame(),
                e.getTipoExame() != null ? e.getTipoExame().name() : null
        );
    }
}
