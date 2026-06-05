package com.api.ero_erp.financeiro.contapagar.mapper;

import com.api.ero_erp.financeiro.contapagar.dtos.ContaPagarResponseDto;
import com.api.ero_erp.financeiro.contapagar.dtos.ParcelaContaPagarResponseDto;
import com.api.ero_erp.financeiro.contapagar.entity.ContaPagar;
import com.api.ero_erp.financeiro.contapagar.entity.ParcelaContaPagar;
import com.api.ero_erp.pessoa.entity.Pessoa;

import java.util.List;

public class ContaPagarMapper {

    private ContaPagarMapper() {}

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    public static ParcelaContaPagarResponseDto toParcelaDto(ParcelaContaPagar p) {
        return new ParcelaContaPagarResponseDto(
                p.getId(),
                p.getNumeroParcela(),
                p.getDataVencimento() != null ? p.getDataVencimento().toString() : null,
                p.getValor(),
                p.getFormaPagamento() != null ? p.getFormaPagamento().getId()   : null,
                p.getFormaPagamento() != null ? p.getFormaPagamento().getNome() : null,
                p.getContaFinanceira() != null ? p.getContaFinanceira().getId()   : null,
                p.getContaFinanceira() != null ? p.getContaFinanceira().getNome() : null,
                p.getDataPagamento() != null ? p.getDataPagamento().toString() : null,
                p.getValorPago(),
                p.getStatus() != null ? p.getStatus().name() : null,
                p.getObservacao()
        );
    }

    public static ContaPagarResponseDto toDto(ContaPagar c) {
        List<ParcelaContaPagarResponseDto> parcelas = c.getParcelas() != null
                ? c.getParcelas().stream().map(ContaPagarMapper::toParcelaDto).toList()
                : List.of();

        return new ContaPagarResponseDto(
                c.getId(),
                c.getEmitente() != null ? c.getEmitente().getId()               : null,
                c.getEmitente() != null ? c.getEmitente().getPessoa().getNome() : null,
                c.getEmitente() != null ? resolverDoc(c.getEmitente().getPessoa()) : null,
                c.getPessoa().getId(),
                c.getPessoa().getNome(),
                resolverDoc(c.getPessoa()),
                c.getData() != null ? c.getData().toString() : null,
                c.getDescricao(),
                c.getValorTotal(),
                c.getStatus() != null ? c.getStatus().name() : null,
                c.getObservacao(),
                c.getAtivo(),
                parcelas,
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null,
                c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null
        );
    }
}
