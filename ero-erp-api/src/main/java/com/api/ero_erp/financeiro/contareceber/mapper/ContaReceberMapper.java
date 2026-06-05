package com.api.ero_erp.financeiro.contareceber.mapper;

import com.api.ero_erp.financeiro.contareceber.dtos.ContaReceberResponseDto;
import com.api.ero_erp.financeiro.contareceber.dtos.ParcelaContaReceberResponseDto;
import com.api.ero_erp.financeiro.contareceber.entity.ContaReceber;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.pessoa.entity.Pessoa;

import java.util.List;

public class ContaReceberMapper {

    private ContaReceberMapper() {}

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    public static ParcelaContaReceberResponseDto toParcelaDto(ParcelaContaReceber p) {
        return new ParcelaContaReceberResponseDto(
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

    public static ContaReceberResponseDto toDto(ContaReceber c) {
        List<ParcelaContaReceberResponseDto> parcelas = c.getParcelas() != null
                ? c.getParcelas().stream().map(ContaReceberMapper::toParcelaDto).toList()
                : List.of();

        return new ContaReceberResponseDto(
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
