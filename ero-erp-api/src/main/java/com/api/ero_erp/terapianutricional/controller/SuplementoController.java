package com.api.ero_erp.terapianutricional.controller;

import com.api.ero_erp.terapianutricional.dto.SuplementoCreateDto;
import com.api.ero_erp.terapianutricional.dto.SuplementoResponseDto;
import com.api.ero_erp.terapianutricional.dto.SuplementoUpdateDto;
import com.api.ero_erp.terapianutricional.service.SuplementoService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/suplementos")
@Tag(name = "Suplementos", description = "Cadastro de suplementos para terapia nutricional")
public class SuplementoController {

    private final SuplementoService service;

    public SuplementoController(SuplementoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista suplementos (do tenant + globais) com paginação e filtros")
    public Page<SuplementoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista suplementos ativos (do tenant + globais) para select")
    public List<SuplementoResponseDto> select() {
        return service.findForSelect();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca suplemento por ID para seletores (do tenant ou global)")
    public SuplementoResponseDto selectById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca suplemento por ID (do tenant ou global)")
    public ResponseEntity<SuplementoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Cria novo suplemento para o tenant logado")
    public ResponseEntity<SuplementoResponseDto> create(@Valid @RequestBody SuplementoCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Atualiza suplemento do próprio tenant (globais não são editáveis)")
    public ResponseEntity<SuplementoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody SuplementoUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Remove suplemento do próprio tenant")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
