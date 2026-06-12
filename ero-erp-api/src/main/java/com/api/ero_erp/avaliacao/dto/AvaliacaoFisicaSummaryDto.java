package com.api.ero_erp.avaliacao.dto;

import com.api.ero_erp.avaliacao.enums.ObjetivoAvaliacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AvaliacaoFisicaSummaryDto(
        Long                            id,
        Long                            pessoaId,
        String                          pessoaNome,
        LocalDate                       dataAvaliacao,
        BigDecimal                      peso,
        BigDecimal                      altura,
        BigDecimal                      imc,
        Integer                         idade,
        String                          sexo,
        ObjetivoAvaliacao               objetivo,
        String                          metaDescricao,
        BigDecimal                      pesoAlvo,
        boolean                         ativo,
        List<MedidaCorporalResponseDto> medidas,
        ComposicaoCorporalResponseDto   composicao
) {}
