package com.api.ero_erp.clinica.dto;

import com.api.ero_erp.clinica.enums.DiaSemana;

import java.math.BigDecimal;

public record ItemPlanoAlimentarResponseDto(
        Long       id,
        DiaSemana  diaSemana,
        String     horario,
        Long       refeicaoId,
        String     refeicaoNome,
        String     quantidade,
        BigDecimal peso,
        String     observacao
) {}
