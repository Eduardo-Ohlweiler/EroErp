package com.api.ero_erp.financeiro.contafinanceira.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraCreateDto;
import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraResponseDto;
import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraUpdateDto;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.contafinanceira.mapper.ContaFinanceiraMapper;
import com.api.ero_erp.financeiro.contafinanceira.repository.ContaFinanceiraRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContaFinanceiraService {

    private final ContaFinanceiraRepository repository;
    private final SecurityUtils             securityUtils;

    public ContaFinanceiraService(ContaFinanceiraRepository repository, SecurityUtils securityUtils) {
        this.repository   = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public ContaFinanceira findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Conta financeira não encontrada"));
    }

    @Transactional(readOnly = true)
    public Page<ContaFinanceiraResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        String nomeFiltro = (nome != null && !nome.isBlank()) ? nome.trim() : null;
        return repository.findAllWithFilters(pageable, clienteId, nomeFiltro, ativo)
                .map(ContaFinanceiraMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ContaFinanceiraResponseDto> select() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return ContaFinanceiraMapper.toDtoList(repository.findForSelect(clienteId));
    }

    @Transactional
    public ContaFinanceiraResponseDto create(ContaFinanceiraCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        if (repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), cliente.getId()))
            throw new ConflictException("Já existe uma conta financeira com esse nome");

        ContaFinanceira conta = new ContaFinanceira();
        conta.setCliente(cliente);
        conta.setNome(dto.nome());
        if (dto.ativo() != null) conta.setAtivo(dto.ativo());

        return ContaFinanceiraMapper.toDto(repository.save(conta));
    }

    @Transactional
    public ContaFinanceiraResponseDto update(Long id, ContaFinanceiraUpdateDto dto) {
        ContaFinanceira conta = findById(id);

        if (dto.nome() != null && !dto.nome().isBlank()) {
            if (!dto.nome().equalsIgnoreCase(conta.getNome()) &&
                    repository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), conta.getCliente().getId()))
                throw new ConflictException("Já existe outra conta financeira com esse nome");
            conta.setNome(dto.nome());
        }

        if (dto.ativo() != null) conta.setAtivo(dto.ativo());

        return ContaFinanceiraMapper.toDto(repository.save(conta));
    }
}
