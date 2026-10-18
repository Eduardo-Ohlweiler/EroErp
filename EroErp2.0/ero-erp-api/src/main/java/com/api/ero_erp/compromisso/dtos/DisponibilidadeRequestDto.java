package com.api.ero_erp.compromisso.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * O que a tela pergunta enquanto se preenche o formulário: nestes horários,
 * quem já está ocupado?
 *
 * @param ignorarId o próprio compromisso, ao alterar
 */
public record DisponibilidadeRequestDto(
        @NotNull(message = "Início é obrigatório")
        Instant inicio,

        @NotNull(message = "Fim é obrigatório")
        Instant fim,

        UUID responsavelId,

        @Size(max = 20, message = "No máximo 20 convidados")
        List<@NotNull UUID> convidadoIds,

        @Valid
        RecorrenciaDto recorrencia,

        /** A lista editada da prévia; nula, valem as datas que o tipo gera. */
        @Size(min = 1, max = 52, message = "A série tem de 1 a 52 datas")
        List<@Valid @NotNull OcorrenciaDto> ocorrencias,

        UUID ignorarId
) {}
