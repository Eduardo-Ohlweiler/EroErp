package com.api.ero_erp.financeiro.lancamento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.service.ContaFinanceiraService;
import com.api.ero_erp.financeiro.enums.TipoLancamento;
import com.api.ero_erp.financeiro.lancamento.dtos.LancamentoFinanceiroCreateDto;
import com.api.ero_erp.financeiro.lancamento.dtos.LancamentoFinanceiroResponseDto;
import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import com.api.ero_erp.financeiro.lancamento.repository.LancamentoFinanceiroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LancamentoFinanceiroService {

    private final LancamentoFinanceiroRepository repository;
    private final SecurityUtils securityUtils;
    private final ContaFinanceiraService contaFinanceiraService;

    public LancamentoFinanceiroService(
            LancamentoFinanceiroRepository repository,
            SecurityUtils securityUtils,
            ContaFinanceiraService contaFinanceiraService
    ) {
        this.repository = repository;
        this.securityUtils = securityUtils;
        this.contaFinanceiraService = contaFinanceiraService;
    }

    @Transactional
    public LancamentoFinanceiroResponseDto create(LancamentoFinanceiroCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();
        ContaFinanceira contaFinanceira = contaFinanceiraService.findById(dto.contaFinanceiraId());

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setCliente(cliente);
        lancamento.setContaFinanceira(contaFinanceira);
        lancamento.setTipo(TipoLancamento.valueOf(dto.tipo()));
        lancamento.setValor(dto.valor());
        lancamento.setDescricao(dto.descricao());
        lancamento.setData(LocalDate.parse(dto.data()));

        LancamentoFinanceiro saved = repository.save(lancamento);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LancamentoFinanceiroResponseDto> findAll() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllByClienteIdOrderByDataDescIdDesc(clienteId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        LancamentoFinanceiro lancamento = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Lançamento financeiro não encontrado"));
        repository.delete(lancamento);
    }

    private LancamentoFinanceiroResponseDto toDto(LancamentoFinanceiro l) {
        return new LancamentoFinanceiroResponseDto(
                l.getId(),
                l.getContaFinanceira() != null ? l.getContaFinanceira().getId() : null,
                l.getContaFinanceira() != null ? l.getContaFinanceira().getNome() : null,
                l.getTipo() != null ? l.getTipo().name() : null,
                l.getValor(),
                l.getDescricao(),
                l.getData() != null ? l.getData().toString() : null,
                l.getCreatedAt() != null ? l.getCreatedAt().toString() : null
        );
    }
}
