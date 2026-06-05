package com.api.ero_erp.financeiro.formapagamento.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.service.ContaFinanceiraService;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoCreateDto;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoResponseDto;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoUpdateDto;
import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import com.api.ero_erp.financeiro.formapagamento.mapper.FormaPagamentoMapper;
import com.api.ero_erp.financeiro.formapagamento.repository.FormaPagamentoRepository;
import com.api.ero_erp.financeiro.tipocobranca.entity.TipoCobranca;
import com.api.ero_erp.financeiro.tipocobranca.service.TipoCobrancaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormaPagamentoService {

    private final FormaPagamentoRepository  repository;
    private final TipoCobrancaService       tipoCobrancaService;
    private final ContaFinanceiraService    contaFinanceiraService;
    private final SecurityUtils             securityUtils;

    public FormaPagamentoService(
            FormaPagamentoRepository repository,
            TipoCobrancaService      tipoCobrancaService,
            ContaFinanceiraService   contaFinanceiraService,
            SecurityUtils            securityUtils
    ) {
        this.repository            = repository;
        this.tipoCobrancaService   = tipoCobrancaService;
        this.contaFinanceiraService = contaFinanceiraService;
        this.securityUtils         = securityUtils;
    }

    @Transactional(readOnly = true)
    public FormaPagamento findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Forma de pagamento não encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<FormaPagamentoResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        String nomeFiltro = (nome != null && !nome.isBlank()) ? nome.trim() : null;
        return repository.findAllWithFilters(pageable, clienteId, nomeFiltro, ativo)
                .map(FormaPagamentoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<FormaPagamentoResponseDto> select() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return FormaPagamentoMapper.toDtoList(repository.findForSelect(clienteId));
    }

    @Transactional
    public FormaPagamentoResponseDto create(FormaPagamentoCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        if (repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), cliente.getId()))
            throw new ConflictException("Já existe uma forma de pagamento com esse nome");

        TipoCobranca    tipo  = tipoCobrancaService.findById(dto.tipoCobrancaId());
        ContaFinanceira conta = contaFinanceiraService.findById(dto.contaFinanceiraId());

        FormaPagamento forma = new FormaPagamento();
        forma.setCliente(cliente);
        forma.setNome(dto.nome());
        forma.setTipoCobranca(tipo);
        forma.setContaFinanceira(conta);
        if (dto.ativo() != null) forma.setAtivo(dto.ativo());

        return FormaPagamentoMapper.toDto(repository.save(forma));
    }

    @Transactional
    public FormaPagamentoResponseDto update(Long id, FormaPagamentoUpdateDto dto) {
        FormaPagamento forma = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            if (!dto.nome().equalsIgnoreCase(forma.getNome()) &&
                    repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), forma.getCliente().getId()))
                throw new ConflictException("Já existe outra forma de pagamento com esse nome");
            forma.setNome(dto.nome());
        }

        if (dto.tipoCobrancaId() != null)
            forma.setTipoCobranca(tipoCobrancaService.findById(dto.tipoCobrancaId()));

        if (dto.contaFinanceiraId() != null)
            forma.setContaFinanceira(contaFinanceiraService.findById(dto.contaFinanceiraId()));

        if (dto.ativo() != null) forma.setAtivo(dto.ativo());

        return FormaPagamentoMapper.toDto(repository.save(forma));
    }
}
