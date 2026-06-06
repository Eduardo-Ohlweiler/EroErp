package com.api.ero_erp.financeiro.transferencia.controller;

import com.api.ero_erp.financeiro.transferencia.dtos.TransferenciaEntreContasCreateDto;
import com.api.ero_erp.financeiro.transferencia.dtos.TransferenciaEntreContasResponseDto;
import com.api.ero_erp.financeiro.transferencia.service.TransferenciaEntreContasService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/financeiro/transferencias")
@Tag(name = "Transferências entre Contas", description = "Transferências entre contas financeiras")
public class TransferenciaEntreContasController {

    private final TransferenciaEntreContasService service;

    public TransferenciaEntreContasController(TransferenciaEntreContasService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<TransferenciaEntreContasResponseDto> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<TransferenciaEntreContasResponseDto> create(@RequestBody TransferenciaEntreContasCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
