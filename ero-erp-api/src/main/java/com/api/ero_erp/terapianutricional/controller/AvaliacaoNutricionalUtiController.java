package com.api.ero_erp.terapianutricional.controller;

import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiCreateDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiResponseDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiSummaryDto;
import com.api.ero_erp.terapianutricional.dto.AvaliacaoNutricionalUtiUpdateDto;
import com.api.ero_erp.terapianutricional.service.AvaliacaoNutricionalUtiService;
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
@RequestMapping("/avaliacoes-nutricionais")
@Tag(name = "Avaliação Nutricional (UTI)", description = "Avaliações nutricionais de terapia nutricional com cálculo de dieta enteral")
public class AvaliacaoNutricionalUtiController {

    private final AvaliacaoNutricionalUtiService service;

    public AvaliacaoNutricionalUtiController(AvaliacaoNutricionalUtiService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista avaliações nutricionais com paginação e filtros")
    public Page<AvaliacaoNutricionalUtiSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataAvaliacao", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista completa de avaliações nutricionais (sem paginação) para exportação")
    public List<AvaliacaoNutricionalUtiResponseDto> export(
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return service.export(pessoaId, dataInicio, dataFim);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca avaliação nutricional por ID")
    public ResponseEntity<AvaliacaoNutricionalUtiResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Cria nova avaliação nutricional")
    public ResponseEntity<AvaliacaoNutricionalUtiResponseDto> create(
            @Valid @RequestBody AvaliacaoNutricionalUtiCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Atualiza avaliação nutricional")
    public ResponseEntity<AvaliacaoNutricionalUtiResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody AvaliacaoNutricionalUtiUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Remove avaliação nutricional")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
