package com.api.ero_erp.clinica.mapper;

import com.api.ero_erp.clinica.dto.RefeicaoResponseDto;
import com.api.ero_erp.clinica.dto.RefeicaoSummaryDto;
import com.api.ero_erp.clinica.entity.Refeicao;

public class RefeicaoMapper {

    private RefeicaoMapper() {}

    public static RefeicaoResponseDto toResponseDto(Refeicao r) {
        return new RefeicaoResponseDto(
                r.getId(),
                r.getNome(),
                r.getDescricao(),
                r.isAtivo(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }

    public static RefeicaoSummaryDto toSummaryDto(Refeicao r) {
        return new RefeicaoSummaryDto(
                r.getId(),
                r.getNome(),
                r.getDescricao(),
                r.isAtivo()
        );
    }
}
