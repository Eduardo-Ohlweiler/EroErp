package com.api.ero_erp.financeiro.contafinanceira.mapper;

import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraResponseDto;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;

import java.util.List;

public class ContaFinanceiraMapper {

    private ContaFinanceiraMapper() {}

    public static ContaFinanceiraResponseDto toDto(ContaFinanceira conta) {
        return new ContaFinanceiraResponseDto(
                conta.getId(),
                conta.getNome(),
                conta.getAtivo()
        );
    }

    public static List<ContaFinanceiraResponseDto> toDtoList(List<ContaFinanceira> contas) {
        return contas.stream().map(ContaFinanceiraMapper::toDto).toList();
    }
}
