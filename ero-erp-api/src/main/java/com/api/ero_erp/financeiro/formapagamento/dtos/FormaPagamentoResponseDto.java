package com.api.ero_erp.financeiro.formapagamento.dtos;

import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraResponseDto;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaResponseDto;

public record FormaPagamentoResponseDto(
        Long                      id,
        String                    nome,
        TipoCobrancaResponseDto   tipoCobranca,
        ContaFinanceiraResponseDto contaFinanceira,
        Boolean                   ativo
) {}
