package com.api.ero_erp.financeiro.lancamento.controller;

import com.api.ero_erp.financeiro.lancamento.dtos.LancamentoFinanceiroCreateDto;
import com.api.ero_erp.financeiro.lancamento.dtos.LancamentoFinanceiroResponseDto;
import com.api.ero_erp.financeiro.lancamento.service.LancamentoFinanceiroService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/financeiro/lancamentos")
@Tag(name = "Lançamentos Financeiros", description = "Gerenciamento de lançamentos financeiros")
public class LancamentoFinanceiroController {

    private final LancamentoFinanceiroService service;

    public LancamentoFinanceiroController(LancamentoFinanceiroService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<LancamentoFinanceiroResponseDto> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<LancamentoFinanceiroResponseDto> create(@RequestBody LancamentoFinanceiroCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
