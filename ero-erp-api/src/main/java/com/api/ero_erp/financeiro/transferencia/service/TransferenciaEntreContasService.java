package com.api.ero_erp.financeiro.transferencia.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.service.ContaFinanceiraService;
import com.api.ero_erp.financeiro.enums.TipoLancamento;
import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import com.api.ero_erp.financeiro.lancamento.repository.LancamentoFinanceiroRepository;
import com.api.ero_erp.financeiro.transferencia.dtos.TransferenciaEntreContasCreateDto;
import com.api.ero_erp.financeiro.transferencia.dtos.TransferenciaEntreContasResponseDto;
import com.api.ero_erp.financeiro.transferencia.entity.TransferenciaEntreContas;
import com.api.ero_erp.financeiro.transferencia.repository.TransferenciaEntreContasRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TransferenciaEntreContasService {

    private final TransferenciaEntreContasRepository repository;
    private final LancamentoFinanceiroRepository      lancamentoRepository;
    private final ContaFinanceiraService              contaFinanceiraService;
    private final SecurityUtils                       securityUtils;

    public TransferenciaEntreContasService(
            TransferenciaEntreContasRepository repository,
            LancamentoFinanceiroRepository      lancamentoRepository,
            ContaFinanceiraService              contaFinanceiraService,
            SecurityUtils                       securityUtils
    ) {
        this.repository             = repository;
        this.lancamentoRepository   = lancamentoRepository;
        this.contaFinanceiraService = contaFinanceiraService;
        this.securityUtils          = securityUtils;
    }

    @Transactional
    public TransferenciaEntreContasResponseDto create(TransferenciaEntreContasCreateDto dto) {
        if (dto.contaOrigemId().equals(dto.contaDestinoId())) {
            throw new BadRequestException("Conta de origem e destino não podem ser iguais");
        }

        Cliente         cliente      = securityUtils.getClienteLogado();
        ContaFinanceira contaOrigem  = contaFinanceiraService.findById(dto.contaOrigemId());
        ContaFinanceira contaDestino = contaFinanceiraService.findById(dto.contaDestinoId());
        LocalDate       data         = LocalDate.parse(dto.data());
        String          descricao    = dto.descricao() != null && !dto.descricao().isBlank()
                                        ? dto.descricao()
                                        : "Transferência entre contas";

        LancamentoFinanceiro saida = new LancamentoFinanceiro();
        saida.setCliente(cliente);
        saida.setContaFinanceira(contaOrigem);
        saida.setTipo(TipoLancamento.SAIDA);
        saida.setValor(dto.valor());
        saida.setDescricao(descricao + " → " + contaDestino.getNome());
        saida.setData(data);
        LancamentoFinanceiro savedSaida = lancamentoRepository.save(saida);

        LancamentoFinanceiro entrada = new LancamentoFinanceiro();
        entrada.setCliente(cliente);
        entrada.setContaFinanceira(contaDestino);
        entrada.setTipo(TipoLancamento.ENTRADA);
        entrada.setValor(dto.valor());
        entrada.setDescricao(descricao + " ← " + contaOrigem.getNome());
        entrada.setData(data);
        LancamentoFinanceiro savedEntrada = lancamentoRepository.save(entrada);

        TransferenciaEntreContas transferencia = new TransferenciaEntreContas();
        transferencia.setCliente(cliente);
        transferencia.setContaOrigem(contaOrigem);
        transferencia.setContaDestino(contaDestino);
        transferencia.setValor(dto.valor());
        transferencia.setData(data);
        transferencia.setDescricao(dto.descricao());
        transferencia.setLancamentoSaida(savedSaida);
        transferencia.setLancamentoEntrada(savedEntrada);

        TransferenciaEntreContas saved = repository.save(transferencia);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TransferenciaEntreContasResponseDto> findAll() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllByClienteIdOrderByDataDescIdDesc(clienteId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        TransferenciaEntreContas transferencia = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

        LancamentoFinanceiro saida   = transferencia.getLancamentoSaida();
        LancamentoFinanceiro entrada = transferencia.getLancamentoEntrada();

        transferencia.setLancamentoSaida(null);
        transferencia.setLancamentoEntrada(null);
        repository.delete(transferencia);

        if (saida   != null) lancamentoRepository.delete(saida);
        if (entrada != null) lancamentoRepository.delete(entrada);
    }

    private TransferenciaEntreContasResponseDto toDto(TransferenciaEntreContas t) {
        return new TransferenciaEntreContasResponseDto(
                t.getId(),
                t.getContaOrigem().getId(),
                t.getContaOrigem().getNome(),
                t.getContaDestino().getId(),
                t.getContaDestino().getNome(),
                t.getValor(),
                t.getData() != null ? t.getData().toString() : null,
                t.getDescricao(),
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null
        );
    }
}
