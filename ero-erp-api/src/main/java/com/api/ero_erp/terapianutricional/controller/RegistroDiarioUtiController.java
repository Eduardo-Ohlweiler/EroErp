package com.api.ero_erp.terapianutricional.controller;

import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiCreateDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiResponseDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiSummaryDto;
import com.api.ero_erp.terapianutricional.dto.RegistroDiarioUtiUpdateDto;
import com.api.ero_erp.terapianutricional.service.RegistroDiarioUtiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/registros-diarios-uti")
@Tag(name = "Registro Diário (UTI)", description = "Ficha diária de UTI por paciente: clínica, laboratório, TNE prescrito x infundido e controle de ingestão oral")
public class RegistroDiarioUtiController {

    private final RegistroDiarioUtiService service;

    public RegistroDiarioUtiController(RegistroDiarioUtiService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista registros diários de UTI com paginação e filtros")
    public Page<RegistroDiarioUtiSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "data", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista completa de registros diários de UTI (sem paginação) para exportação")
    public List<RegistroDiarioUtiResponseDto> export(
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return service.export(pessoaId, dataInicio, dataFim);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca registro diário de UTI por ID")
    public ResponseEntity<RegistroDiarioUtiResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Cria novo registro diário de UTI")
    public ResponseEntity<RegistroDiarioUtiResponseDto> create(
            @Valid @RequestBody RegistroDiarioUtiCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Atualiza registro diário de UTI")
    public ResponseEntity<RegistroDiarioUtiResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody RegistroDiarioUtiUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Remove registro diário de UTI")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
