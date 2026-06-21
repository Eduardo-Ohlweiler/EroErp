package com.api.ero_erp.otorrino.mapper;

import com.api.ero_erp.otorrino.dto.ImitanciometriaResponseDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaSummaryDto;
import com.api.ero_erp.otorrino.entity.Imitanciometria;

/** Mapper utilitário (estático) para a entidade Imitanciometria. */
public final class ImitanciometriaMapper {

    private ImitanciometriaMapper() {
    }

    public static ImitanciometriaResponseDto toResponseDto(Imitanciometria i) {
        return new ImitanciometriaResponseDto(
                i.getId(),
                i.getPessoa().getId(),
                i.getPessoa().getNome(),
                i.getUsuario() != null ? i.getUsuario().getId() : null,
                i.getUsuario() != null ? i.getUsuario().getNome() : null,
                i.getConsulta() != null ? i.getConsulta().getId() : null,
                i.getDataExame(),
                i.getCurvaOd() != null ? i.getCurvaOd().name() : null,
                i.getCurvaOe() != null ? i.getCurvaOe().name() : null,
                i.getPicoPressaoOdDapa(),
                i.getPicoPressaoOeDapa(),
                i.getComplacenciaOdMl(),
                i.getComplacenciaOeMl(),
                i.getVolumeCanalOdMl(),
                i.getVolumeCanalOeMl(),
                i.getReflexoIpsiOd() != null ? i.getReflexoIpsiOd().name() : null,
                i.getReflexoContraOd() != null ? i.getReflexoContraOd().name() : null,
                i.getReflexoIpsiOe() != null ? i.getReflexoIpsiOe().name() : null,
                i.getReflexoContraOe() != null ? i.getReflexoContraOe().name() : null,
                i.getObservacao(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }

    public static ImitanciometriaSummaryDto toSummaryDto(Imitanciometria i) {
        return new ImitanciometriaSummaryDto(
                i.getId(),
                i.getPessoa().getId(),
                i.getPessoa().getNome(),
                i.getDataExame(),
                i.getCurvaOd() != null ? i.getCurvaOd().name() : null,
                i.getCurvaOe() != null ? i.getCurvaOe().name() : null
        );
    }
}
