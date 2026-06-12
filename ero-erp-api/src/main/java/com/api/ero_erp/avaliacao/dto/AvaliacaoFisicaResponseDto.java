package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.ObjetivoAvaliacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AvaliacaoFisicaResponseDto(
        Long                            id,
        Long                            pessoaId,
        String                          pessoaNome,
        Long                            usuarioId,
        String                          usuarioNome,
        LocalDate                       dataAvaliacao,
        BigDecimal                      peso,
        BigDecimal                      altura,
        BigDecimal                      imc,
        Integer                         idade,
        String                          sexo,
        ObjetivoAvaliacao               objetivo,
        String                          metaDescricao,
        BigDecimal                      pesoAlvo,
        String                          observacoes,
        boolean                         ativo,
        List<MedidaCorporalResponseDto> medidas,
        ComposicaoCorporalResponseDto   composicao,
        LocalDateTime                   createdAt,
        LocalDateTime                   updatedAt
) {}
