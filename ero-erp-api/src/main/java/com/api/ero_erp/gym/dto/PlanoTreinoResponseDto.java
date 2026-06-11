package com.api.ero_erp.gym.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PlanoTreinoResponseDto(
        Long                       id,
        Long                       pessoaId,
        String                     pessoaNome,
        Long                       emitenteId,
        String                     emitenteNome,
        String                     nome,
        LocalDate                  dataInicio,
        LocalDate                  dataFim,
        String                     observacao,
        boolean                    ativo,
        List<ItemPlanoTreinoResponseDto> itens,
        LocalDateTime              createdAt,
        LocalDateTime              updatedAt
) {}
