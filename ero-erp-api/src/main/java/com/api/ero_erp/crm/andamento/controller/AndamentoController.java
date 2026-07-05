package com.api.ero_erp.crm.andamento.controller;

import com.api.ero_erp.crm.andamento.dtos.AndamentoResponseDto;
import com.api.ero_erp.crm.andamento.dtos.AndamentoUpsertDto;
import com.api.ero_erp.crm.andamento.service.AndamentoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/crm/andamentos")
public class AndamentoController {

    private final AndamentoService service;

    public AndamentoController(AndamentoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<List<AndamentoResponseDto>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<AndamentoResponseDto> criar(@Valid @RequestBody AndamentoUpsertDto dto) {
        return new ResponseEntity<>(service.criar(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<AndamentoResponseDto> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AndamentoUpsertDto dto
    ) {
        return ResponseEntity.ok(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
