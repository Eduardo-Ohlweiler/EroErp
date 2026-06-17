package com.api.ero_erp.pediatria.controller;

import com.api.ero_erp.pediatria.dto.FormulaLacteaCreateDto;
import com.api.ero_erp.pediatria.dto.FormulaLacteaResponseDto;
import com.api.ero_erp.pediatria.dto.FormulaLacteaUpdateDto;
import com.api.ero_erp.pediatria.service.FormulaLacteaService;
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
@RequestMapping("/formulas-lacteas")
@Tag(name = "Fórmulas Lácteas", description = "Cadastro de fórmulas lácteas para pediatria")
public class FormulaLacteaController {

    private final FormulaLacteaService service;

    public FormulaLacteaController(FormulaLacteaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Lista fórmulas lácteas (do tenant + globais) com paginação e filtros")
    public Page<FormulaLacteaResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Lista fórmulas lácteas ativas (do tenant + globais) para select")
    public List<FormulaLacteaResponseDto> select() {
        return service.findForSelect();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Busca fórmula láctea por ID para seletores (do tenant ou global)")
    public FormulaLacteaResponseDto selectById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    @Operation(summary = "Busca fórmula láctea por ID (do tenant ou global)")
    public ResponseEntity<FormulaLacteaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Cria nova fórmula láctea para o tenant logado")
    public ResponseEntity<FormulaLacteaResponseDto> create(@Valid @RequestBody FormulaLacteaCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Atualiza fórmula láctea do próprio tenant (globais não são editáveis)")
    public ResponseEntity<FormulaLacteaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody FormulaLacteaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA')")
    @Operation(summary = "Remove fórmula láctea do próprio tenant")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
