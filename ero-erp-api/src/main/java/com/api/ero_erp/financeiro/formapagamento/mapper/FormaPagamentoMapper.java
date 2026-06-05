package com.api.ero_erp.financeiro.formapagamento.mapper;

import com.api.ero_erp.financeiro.contafinanceira.mapper.ContaFinanceiraMapper;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoResponseDto;
import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import com.api.ero_erp.financeiro.tipocobranca.mapper.TipoCobrancaMapper;

import java.util.List;

public class FormaPagamentoMapper {

    private FormaPagamentoMapper() {}

    public static FormaPagamentoResponseDto toDto(FormaPagamento forma) {
        return new FormaPagamentoResponseDto(
                forma.getId(),
                forma.getNome(),
                TipoCobrancaMapper.toDto(forma.getTipoCobranca()),
                ContaFinanceiraMapper.toDto(forma.getContaFinanceira()),
                forma.getAtivo()
        );
    }

    public static List<FormaPagamentoResponseDto> toDtoList(List<FormaPagamento> formas) {
        return formas.stream().map(FormaPagamentoMapper::toDto).toList();
    }
}
