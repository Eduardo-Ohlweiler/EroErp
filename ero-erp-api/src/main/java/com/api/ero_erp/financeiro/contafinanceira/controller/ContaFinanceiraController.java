package com.api.ero_erp.financeiro.contafinanceira.controller;

import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraCreateDto;
import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraResponseDto;
import com.api.ero_erp.financeiro.contafinanceira.dtos.ContaFinanceiraUpdateDto;
import com.api.ero_erp.financeiro.contafinanceira.mapper.ContaFinanceiraMapper;
import com.api.ero_erp.financeiro.contafinanceira.service.ContaFinanceiraService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/financeiro/contas")
@Tag(name = "Contas Financeiras", description = "Gerenciamento de contas financeiras")
public class ContaFinanceiraController {

    private final ContaFinanceiraService service;

    public ContaFinanceiraController(ContaFinanceiraService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public Page<ContaFinanceiraResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<ContaFinanceiraResponseDto> select() {
        return service.select();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public ContaFinanceiraResponseDto findByIdForSelect(@PathVariable Long id) {
        return ContaFinanceiraMapper.toDto(service.findById(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public ContaFinanceiraResponseDto findById(@PathVariable Long id) {
        return ContaFinanceiraMapper.toDto(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaFinanceiraResponseDto> create(@Valid @RequestBody ContaFinanceiraCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaFinanceiraResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ContaFinanceiraUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
