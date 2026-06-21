package com.api.ero_erp.otorrino.dto;

public record QuestionarioItemDto(
        Long   id,
        int    ordem,
        String enunciado,
        String dominio
) {}
