package com.api.ero_erp.otorrino.mapper;

import com.api.ero_erp.otorrino.dto.QuestionarioDetalheDto;
import com.api.ero_erp.otorrino.dto.QuestionarioItemDto;
import com.api.ero_erp.otorrino.dto.QuestionarioOpcaoDto;
import com.api.ero_erp.otorrino.dto.QuestionarioSummaryDto;
import com.api.ero_erp.otorrino.entity.Questionario;
import com.api.ero_erp.otorrino.entity.QuestionarioItem;
import com.api.ero_erp.otorrino.entity.QuestionarioOpcao;

import java.util.List;

/** Mapper utilitário (estático) para o catálogo de questionários. */
public final class QuestionarioMapper {

    private QuestionarioMapper() {
    }

    public static QuestionarioSummaryDto toSummaryDto(Questionario q) {
        return new QuestionarioSummaryDto(
                q.getId(),
                q.getCodigo() != null ? q.getCodigo().name() : null,
                q.getNome(),
                q.getDescricao()
        );
    }

    public static QuestionarioDetalheDto toDetalheDto(Questionario q) {
        return new QuestionarioDetalheDto(
                q.getId(),
                q.getCodigo() != null ? q.getCodigo().name() : null,
                q.getNome(),
                q.getDescricao(),
                q.getInstrucao(),
                toOpcaoDtos(q.getOpcoes()),
                toItemDtos(q.getItens())
        );
    }

    public static List<QuestionarioOpcaoDto> toOpcaoDtos(List<QuestionarioOpcao> opcoes) {
        if (opcoes == null) return List.of();
        return opcoes.stream().map(QuestionarioMapper::toOpcaoDto).toList();
    }

    public static QuestionarioOpcaoDto toOpcaoDto(QuestionarioOpcao o) {
        return new QuestionarioOpcaoDto(
                o.getId(),
                o.getOrdem(),
                o.getRotulo(),
                o.getValor()
        );
    }

    public static List<QuestionarioItemDto> toItemDtos(List<QuestionarioItem> itens) {
        if (itens == null) return List.of();
        return itens.stream().map(QuestionarioMapper::toItemDto).toList();
    }

    public static QuestionarioItemDto toItemDto(QuestionarioItem i) {
        return new QuestionarioItemDto(
                i.getId(),
                i.getOrdem(),
                i.getEnunciado(),
                i.getDominio()
        );
    }
}
