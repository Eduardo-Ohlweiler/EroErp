package com.api.ero_erp.otorrino.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record QuestionarioAplicadoCreateDto(

        @Schema(description = "ID da pessoa avaliada")
        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @Schema(description = "ID do questionário aplicado")
        @NotNull(message = "Questionário é obrigatório")
        Long questionarioId,

        @Schema(description = "ID da consulta vinculada — opcional")
        Long consultaId,

        @Schema(description = "Data da aplicação")
        @NotNull(message = "Data da aplicação é obrigatória")
        LocalDate dataAplicacao,

        @Schema(description = "Respostas aos itens do questionário")
        @NotEmpty(message = "É necessário informar ao menos uma resposta")
        @Valid
        List<RespostaDto> respostas

) {}
