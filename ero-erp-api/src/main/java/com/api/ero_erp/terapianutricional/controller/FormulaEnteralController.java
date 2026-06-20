package com.api.ero_erp.terapianutricional.controller;

import com.api.ero_erp.terapianutricional.dto.FormulaEnteralCreateDto;
import com.api.ero_erp.terapianutricional.dto.FormulaEnteralResponseDto;
import com.api.ero_erp.terapianutricional.dto.FormulaEnteralUpdateDto;
import com.api.ero_erp.terapianutricional.service.FormulaEnteralService;
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
@RequestMapping("/formulas-enterais")
@Tag(name = "Fórmulas Enterais", description = "Cadastro de fórmulas enterais para terapia nutricional")
public class FormulaEnteralController {

    private final FormulaEnteralService service;

    public FormulaEnteralController(FormulaEnteralService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista fórmulas enterais (do tenant + globais) com paginação e filtros")
    public Page<FormulaEnteralResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) String  categoria,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, categoria, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Lista fórmulas enterais ativas (do tenant + globais) para select")
    public List<FormulaEnteralResponseDto> select() {
        return service.findForSelect();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca fórmula enteral por ID para seletores (do tenant ou global)")
    public FormulaEnteralResponseDto selectById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    @Operation(summary = "Busca fórmula enteral por ID (do tenant ou global)")
    public ResponseEntity<FormulaEnteralResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Cria nova fórmula enteral para o tenant logado")
    public ResponseEntity<FormulaEnteralResponseDto> create(@Valid @RequestBody FormulaEnteralCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Atualiza fórmula enteral do próprio tenant (globais não são editáveis)")
    public ResponseEntity<FormulaEnteralResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody FormulaEnteralUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL')")
    @Operation(summary = "Remove fórmula enteral do próprio tenant")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
