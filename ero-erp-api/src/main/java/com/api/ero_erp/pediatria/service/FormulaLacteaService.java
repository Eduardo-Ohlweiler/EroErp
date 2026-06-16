package com.api.ero_erp.pediatria.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pediatria.dto.FormulaLacteaCreateDto;
import com.api.ero_erp.pediatria.dto.FormulaLacteaResponseDto;
import com.api.ero_erp.pediatria.dto.FormulaLacteaUpdateDto;
import com.api.ero_erp.pediatria.entity.FormulaLactea;
import com.api.ero_erp.pediatria.repository.FormulaLacteaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormulaLacteaService {

    private final FormulaLacteaRepository repository;
    private final SecurityUtils           securityUtils;

    public FormulaLacteaService(FormulaLacteaRepository repository, SecurityUtils securityUtils) {
        this.repository    = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<FormulaLacteaResponseDto> getAll(Pageable pageable, String nome, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, nome, ativo)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<FormulaLacteaResponseDto> findForSelect() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findForSelect(clienteId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FormulaLacteaResponseDto findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Fórmula láctea não encontrada, verifique!"));
    }

    @Transactional
    public FormulaLacteaResponseDto create(FormulaLacteaCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        FormulaLactea formula = new FormulaLactea();
        formula.setCliente(cliente);
        formula.setNome(dto.nome().trim());
        formula.setKcalPor100ml(dto.kcalPor100ml());
        formula.setProteinaPor100ml(dto.proteinaPor100ml());
        formula.setAtivo(dto.ativo() == null || dto.ativo());

        return toDto(repository.save(formula));
    }

    @Transactional
    public FormulaLacteaResponseDto update(Long id, FormulaLacteaUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        FormulaLactea formula = repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula láctea não encontrada, verifique!"));

        if (formula.getCliente() == null) {
            throw new BadRequestException("Não é possível editar uma fórmula láctea global do sistema, verifique!");
        }

        if (dto.nome() != null && !dto.nome().isBlank()) formula.setNome(dto.nome().trim());
        if (dto.kcalPor100ml() != null)                  formula.setKcalPor100ml(dto.kcalPor100ml());
        if (dto.proteinaPor100ml() != null)              formula.setProteinaPor100ml(dto.proteinaPor100ml());
        if (dto.ativo() != null)                         formula.setAtivo(dto.ativo());

        return toDto(repository.save(formula));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();

        FormulaLactea formula = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula láctea não encontrada, verifique!"));

        repository.delete(formula);
    }

    private FormulaLacteaResponseDto toDto(FormulaLactea f) {
        return new FormulaLacteaResponseDto(
                f.getId(),
                f.getNome(),
                f.getKcalPor100ml(),
                f.getProteinaPor100ml(),
                f.isAtivo(),
                f.getCliente() == null
        );
    }
}
