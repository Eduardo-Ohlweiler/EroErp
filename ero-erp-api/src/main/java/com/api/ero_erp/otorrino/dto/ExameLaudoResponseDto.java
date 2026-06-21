package com.api.ero_erp.otorrino.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExameLaudoResponseDto(
        Long          id,
        Long          pessoaId,
        String        pessoaNome,
        Long          usuarioId,
        String        usuarioNome,
        Long          consultaId,
        LocalDate     dataExame,
        String        tipoExame,
        String        laudo,
        String        conclusao,
        String        cid,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
