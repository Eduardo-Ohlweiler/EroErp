package com.api.ero_erp.terapianutricional.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.terapianutricional.dto.FormulaEnteralCreateDto;
import com.api.ero_erp.terapianutricional.dto.FormulaEnteralResponseDto;
import com.api.ero_erp.terapianutricional.dto.FormulaEnteralUpdateDto;
import com.api.ero_erp.terapianutricional.entity.FormulaEnteral;
import com.api.ero_erp.terapianutricional.repository.FormulaEnteralRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FormulaEnteralService {

    private final FormulaEnteralRepository repository;
    private final SecurityUtils            securityUtils;

    public FormulaEnteralService(FormulaEnteralRepository repository, SecurityUtils securityUtils) {
        this.repository    = repository;
        this.securityUtils = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<FormulaEnteralResponseDto> getAll(Pageable pageable, String nome, String categoria, Boolean ativo) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findAllWithFilters(pageable, clienteId, nome, categoria, ativo)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<FormulaEnteralResponseDto> findForSelect() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findForSelect(clienteId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FormulaEnteralResponseDto findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Fórmula enteral não encontrada, verifique!"));
    }

    @Transactional
    public FormulaEnteralResponseDto create(FormulaEnteralCreateDto dto) {
        Cliente cliente = securityUtils.getClienteLogado();

        FormulaEnteral formula = new FormulaEnteral();
        formula.setCliente(cliente);
        formula.setNome(dto.nome().trim());
        formula.setDensidadeKcalMl(dto.densidadeKcalMl());
        formula.setProteinaGL(dto.proteinaGL());
        formula.setCategoria(dto.categoria() != null ? dto.categoria().trim() : null);
        formula.setCho(dto.cho());
        formula.setLip(dto.lip());
        formula.setFibras(dto.fibras());
        formula.setPotassio(dto.potassio());
        formula.setOsmolaridade(dto.osmolaridade());
        formula.setAtivo(dto.ativo() == null || dto.ativo());

        return toDto(repository.save(formula));
    }

    @Transactional
    public FormulaEnteralResponseDto update(Long id, FormulaEnteralUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        FormulaEnteral formula = repository.findByIdAndClienteIdOrGlobal(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula enteral não encontrada, verifique!"));

        if (formula.getCliente() == null) {
            throw new BadRequestException("Não é possível editar uma fórmula enteral global do sistema, verifique!");
        }

        if (dto.nome() != null && !dto.nome().isBlank()) formula.setNome(dto.nome().trim());
        if (dto.densidadeKcalMl() != null)               formula.setDensidadeKcalMl(dto.densidadeKcalMl());
        if (dto.proteinaGL() != null)                    formula.setProteinaGL(dto.proteinaGL());
        if (dto.categoria() != null)                     formula.setCategoria(dto.categoria().isBlank() ? null : dto.categoria().trim());
        if (dto.cho() != null)                           formula.setCho(dto.cho());
        if (dto.lip() != null)                           formula.setLip(dto.lip());
        if (dto.fibras() != null)                        formula.setFibras(dto.fibras());
        if (dto.potassio() != null)                      formula.setPotassio(dto.potassio());
        if (dto.osmolaridade() != null)                  formula.setOsmolaridade(dto.osmolaridade());
        if (dto.ativo() != null)                         formula.setAtivo(dto.ativo());

        return toDto(repository.save(formula));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();

        FormulaEnteral formula = repository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Fórmula enteral não encontrada, verifique!"));

        repository.delete(formula);
    }

    private FormulaEnteralResponseDto toDto(FormulaEnteral f) {
        return new FormulaEnteralResponseDto(
                f.getId(),
                f.getNome(),
                f.getDensidadeKcalMl(),
                f.getProteinaGL(),
                f.getCategoria(),
                f.getCho(),
                f.getLip(),
                f.getFibras(),
                f.getPotassio(),
                f.getOsmolaridade(),
                f.isAtivo(),
                f.getCliente() == null
        );
    }
}
