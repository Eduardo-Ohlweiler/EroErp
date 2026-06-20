package com.api.ero_erp.pediatria.controller;

import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaCreateDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaResponseDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaSummaryDto;
import com.api.ero_erp.pediatria.dto.AvaliacaoPediatricaUpdateDto;
import com.api.ero_erp.pediatria.service.AvaliacaoPediatricaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/avaliacoes-pediatricas")
@Tag(name = "Avaliação Pediátrica", description = "Avaliações pediátricas com cálculo de dieta")
public class AvaliacaoPediatricaController {

    private final AvaliacaoPediatricaService service;

    public AvaliacaoPediatricaController(AvaliacaoPediatricaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Lista avaliações pediátricas com paginação e filtros")
    public Page<AvaliacaoPediatricaSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataAvaliacao", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long formulaLacteaId,
            @RequestParam(required = false) Integer mesesMin,
            @RequestParam(required = false) Integer mesesMax
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim, formulaLacteaId, mesesMin, mesesMax);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Lista completa (sem paginação) para exportação PDF/planilha")
    public ResponseEntity<java.util.List<AvaliacaoPediatricaResponseDto>> export(
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long formulaLacteaId,
            @RequestParam(required = false) Integer mesesMin,
            @RequestParam(required = false) Integer mesesMax
    ) {
        return ResponseEntity.ok(service.getAllForExport(pessoaId, dataInicio, dataFim, formulaLacteaId, mesesMin, mesesMax));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Busca avaliação pediátrica por ID")
    public ResponseEntity<AvaliacaoPediatricaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Cria nova avaliação pediátrica")
    public ResponseEntity<AvaliacaoPediatricaResponseDto> create(
            @Valid @RequestBody AvaliacaoPediatricaCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Atualiza avaliação pediátrica")
    public ResponseEntity<AvaliacaoPediatricaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody AvaliacaoPediatricaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Remove avaliação pediátrica")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
