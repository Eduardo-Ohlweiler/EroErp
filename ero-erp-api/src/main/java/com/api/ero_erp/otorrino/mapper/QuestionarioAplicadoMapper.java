package com.api.ero_erp.otorrino.mapper;

import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoResponseDto;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoSummaryDto;
import com.api.ero_erp.otorrino.dto.RespostaResponseDto;
import com.api.ero_erp.otorrino.entity.QuestionarioAplicado;
import com.api.ero_erp.otorrino.entity.QuestionarioResposta;

import java.util.List;

/** Mapper utilitário (estático) para questionários aplicados. */
public final class QuestionarioAplicadoMapper {

    private QuestionarioAplicadoMapper() {
    }

    public static QuestionarioAplicadoResponseDto toResponseDto(QuestionarioAplicado a) {
        return new QuestionarioAplicadoResponseDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getUsuario() != null ? a.getUsuario().getNome() : null,
                a.getConsulta() != null ? a.getConsulta().getId() : null,
                a.getQuestionario().getId(),
                a.getQuestionario().getCodigo() != null ? a.getQuestionario().getCodigo().name() : null,
                a.getQuestionario().getNome(),
                a.getDataAplicacao(),
                a.getScoreTotal(),
                a.getClassificacao(),
                a.getInterpretacao(),
                a.getCreatedAt(),
                toRespostaDtos(a.getRespostas())
        );
    }

    public static QuestionarioAplicadoSummaryDto toSummaryDto(QuestionarioAplicado a) {
        return new QuestionarioAplicadoSummaryDto(
                a.getId(),
                a.getPessoa().getId(),
                a.getPessoa().getNome(),
                a.getQuestionario().getCodigo() != null ? a.getQuestionario().getCodigo().name() : null,
                a.getQuestionario().getNome(),
                a.getDataAplicacao(),
                a.getScoreTotal(),
                a.getClassificacao()
        );
    }

    public static List<RespostaResponseDto> toRespostaDtos(List<QuestionarioResposta> respostas) {
        if (respostas == null) return List.of();
        return respostas.stream().map(QuestionarioAplicadoMapper::toRespostaDto).toList();
    }

    public static RespostaResponseDto toRespostaDto(QuestionarioResposta r) {
        return new RespostaResponseDto(
                r.getItem().getId(),
                r.getItem().getEnunciado(),
                r.getValor()
        );
    }
}
