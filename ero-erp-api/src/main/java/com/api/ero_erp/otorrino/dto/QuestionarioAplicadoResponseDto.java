package com.api.ero_erp.otorrino.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record QuestionarioAplicadoResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        String        usuarioNome,
        Long          consultaId,
        Long          questionarioId,
        String        questionarioCodigo,
        String        questionarioNome,
        LocalDate     dataAplicacao,
        Integer       scoreTotal,
        String        classificacao,
        String        interpretacao,
        LocalDateTime createdAt,
        List<RespostaResponseDto> respostas
) {}
