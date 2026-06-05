package com.api.ero_erp.financeiro.contareceber.service;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.service.ContaFinanceiraService;
import com.api.ero_erp.financeiro.contareceber.dtos.*;
import com.api.ero_erp.financeiro.contareceber.entity.ContaReceber;
import com.api.ero_erp.financeiro.contareceber.entity.ParcelaContaReceber;
import com.api.ero_erp.financeiro.contareceber.mapper.ContaReceberMapper;
import com.api.ero_erp.financeiro.contareceber.repository.ContaReceberRepository;
import com.api.ero_erp.financeiro.contareceber.repository.ParcelaContaReceberRepository;
import com.api.ero_erp.financeiro.enums.StatusConta;
import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import com.api.ero_erp.financeiro.formapagamento.service.FormaPagamentoService;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ContaReceberService {

    private final ContaReceberRepository        repository;
    private final ParcelaContaReceberRepository parcelaRepository;
    private final SecurityUtils                 securityUtils;
    private final EmitenteService               emitenteService;
    private final PessoaService                 pessoaService;
    private final FormaPagamentoService         formaPagamentoService;
    private final ContaFinanceiraService        contaFinanceiraService;

    public ContaReceberService(
            ContaReceberRepository        repository,
            ParcelaContaReceberRepository parcelaRepository,
            SecurityUtils                 securityUtils,
            EmitenteService               emitenteService,
            PessoaService                 pessoaService,
            FormaPagamentoService         formaPagamentoService,
            ContaFinanceiraService        contaFinanceiraService
    ) {
        this.repository             = repository;
        this.parcelaRepository      = parcelaRepository;
        this.securityUtils          = securityUtils;
        this.emitenteService        = emitenteService;
        this.pessoaService          = pessoaService;
        this.formaPagamentoService  = formaPagamentoService;
        this.contaFinanceiraService = contaFinanceiraService;
    }

    @Transactional(readOnly = true)
    public ContaReceber findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Conta a receber não encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<ContaReceberResponseDto> getAll(
            Pageable pageable, Long emitenteId, Long pessoaId,
            String status, String dataInicio, String dataFim, Boolean ativo
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        LocalDate di = (dataInicio != null && !dataInicio.isBlank()) ? LocalDate.parse(dataInicio) : null;
        LocalDate df = (dataFim    != null && !dataFim.isBlank())    ? LocalDate.parse(dataFim)    : null;
        String statusFiltro = (status != null && !status.isBlank()) ? status : null;
        return repository.findAllWithFilters(pageable, clienteId, emitenteId, pessoaId, statusFiltro, di, df, ativo)
                .map(ContaReceberMapper::toDto);
    }

    @Transactional
    public ContaReceberResponseDto create(ContaReceberCreateDto dto) {
        Cliente  cliente  = securityUtils.getClienteLogado();
        Pessoa   pessoa   = pessoaService.findById(dto.pessoaId());
        Emitente emitente = dto.emitenteId() != null ? emitenteService.findById(dto.emitenteId()) : null;

        ContaReceber conta = new ContaReceber();
        conta.setCliente(cliente);
        conta.setEmitente(emitente);
        conta.setPessoa(pessoa);
        conta.setData(LocalDate.parse(dto.data()));
        conta.setDescricao(dto.descricao());
        conta.setValorTotal(dto.valorTotal());
        conta.setObservacao(dto.observacao());

        List<ParcelaContaReceber> parcelas = buildParcelas(dto.parcelas(), conta);
        conta.getParcelas().addAll(parcelas);

        long pagas = parcelas.stream().filter(p -> p.getStatus() == StatusConta.PAGO).count();
        if (!parcelas.isEmpty() && pagas == parcelas.size()) conta.setStatus(StatusConta.PAGO);
        else if (pagas > 0) conta.setStatus(StatusConta.PARCIALMENTE_PAGO);
        else conta.setStatus(StatusConta.ABERTO);

        return ContaReceberMapper.toDto(repository.save(conta));
    }

    @Transactional
    public ContaReceberResponseDto update(Long id, ContaReceberUpdateDto dto) {
        ContaReceber conta = findById(id);

        if (dto.emitenteId() != null)
            conta.setEmitente(emitenteService.findById(dto.emitenteId()));
        else
            conta.setEmitente(null);

        if (dto.pessoaId() != null)
            conta.setPessoa(pessoaService.findById(dto.pessoaId()));

        if (dto.data() != null && !dto.data().isBlank())
            conta.setData(LocalDate.parse(dto.data()));

        if (dto.descricao() != null) conta.setDescricao(dto.descricao());
        if (dto.valorTotal() != null) conta.setValorTotal(dto.valorTotal());
        if (dto.observacao() != null) conta.setObservacao(dto.observacao());
        if (dto.ativo() != null) conta.setAtivo(dto.ativo());

        if (dto.status() != null && !dto.status().isBlank())
            conta.setStatus(StatusConta.valueOf(dto.status()));

        if (dto.parcelas() != null) {
            conta.getParcelas().clear();
            List<ParcelaContaReceber> novas = buildParcelas(dto.parcelas(), conta);
            conta.getParcelas().addAll(novas);
        }

        return ContaReceberMapper.toDto(repository.save(conta));
    }

    @Transactional
    public ContaReceberResponseDto pagarParcela(Long parcelaId, ParcelaContaReceberPagarDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        ParcelaContaReceber parcela = parcelaRepository.findByIdAndClienteId(parcelaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Parcela não encontrada"));

        FormaPagamento forma = formaPagamentoService.findById(dto.formaPagamentoId());
        ContaFinanceira conta = contaFinanceiraService.findById(dto.contaFinanceiraId());

        parcela.setDataPagamento(LocalDate.parse(dto.dataPagamento()));
        parcela.setValorPago(dto.valorPago());
        parcela.setFormaPagamento(forma);
        parcela.setContaFinanceira(conta);
        parcela.setStatus(StatusConta.PAGO);
        parcelaRepository.save(parcela);

        recalcularStatusConta(parcela.getContaReceber());

        return ContaReceberMapper.toDto(findById(parcela.getContaReceber().getId()));
    }

    private void recalcularStatusConta(ContaReceber conta) {
        long total = conta.getParcelas().size();
        long pagas = conta.getParcelas().stream()
                .filter(p -> p.getStatus() == StatusConta.PAGO).count();

        if (pagas == 0) conta.setStatus(StatusConta.ABERTO);
        else if (pagas == total) conta.setStatus(StatusConta.PAGO);
        else conta.setStatus(StatusConta.PARCIALMENTE_PAGO);

        repository.save(conta);
    }

    private List<ParcelaContaReceber> buildParcelas(List<ParcelaContaReceberCreateDto> dtos, ContaReceber conta) {
        List<ParcelaContaReceber> parcelas = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            ParcelaContaReceberCreateDto dto = dtos.get(i);
            ParcelaContaReceber p = new ParcelaContaReceber();
            p.setContaReceber(conta);
            p.setNumeroParcela(i + 1);
            p.setDataVencimento(LocalDate.parse(dto.dataVencimento()));
            p.setValor(dto.valor());
            p.setObservacao(dto.observacao());
            if (dto.formaPagamentoId() != null)
                p.setFormaPagamento(formaPagamentoService.findById(dto.formaPagamentoId()));
            if (dto.contaFinanceiraId() != null)
                p.setContaFinanceira(contaFinanceiraService.findById(dto.contaFinanceiraId()));
            if (dto.dataPagamento() != null && !dto.dataPagamento().isBlank() && dto.valorPago() != null) {
                p.setDataPagamento(LocalDate.parse(dto.dataPagamento()));
                p.setValorPago(dto.valorPago());
                p.setStatus(StatusConta.PAGO);
            }
            parcelas.add(p);
        }
        return parcelas;
    }
}
