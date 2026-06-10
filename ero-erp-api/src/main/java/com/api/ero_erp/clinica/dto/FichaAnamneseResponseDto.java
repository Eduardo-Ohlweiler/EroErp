package com.api.ero_erp.clinica.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record FichaAnamneseResponseDto(
        Long                             id,
        Long                             templateId,
        String                           templateNome,
        String                           finalidade,
        Long                             pessoaId,
        String                           pessoaNome,
        String                           pessoaDocumento,
        Long                             emitenteId,
        String                           emitenteNome,
        LocalDate                        dataPreenchimento,
        String                           observacoes,
        List<RespostaAnamneseResponseDto> respostas,
        LocalDateTime                    createdAt,
        String                           createdByNome
) {}
