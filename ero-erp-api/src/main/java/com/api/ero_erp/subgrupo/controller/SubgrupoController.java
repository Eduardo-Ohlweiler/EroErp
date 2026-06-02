package com.api.ero_erp.subgrupo.controller;

import com.api.ero_erp.subgrupo.dtos.SubgrupoCreateDto;
import com.api.ero_erp.subgrupo.dtos.SubgrupoResponseDto;
import com.api.ero_erp.subgrupo.dtos.SubgrupoUpdateDto;
import com.api.ero_erp.subgrupo.service.SubgrupoService;
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
@RequestMapping("/subgrupos")
@Tag(name = "Subgrupos", description = "Gerenciamento de subgrupos de produto por cliente")
public class SubgrupoController {

    private final SubgrupoService subgrupoService;

    public SubgrupoController(SubgrupoService subgrupoService) {
        this.subgrupoService = subgrupoService;
    }

    @Operation(summary = "Lista subgrupos com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO', 'SUBGRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public Page<SubgrupoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) Long    grupoId,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String  nome
    ) {
        return subgrupoService.getAll(pageable, grupoId, ativo, nome);
    }

    @Operation(summary = "Lista subgrupos ativos para selects")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO', 'SUBGRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public List<SubgrupoResponseDto> select(
            @RequestParam(required = false) Long   grupoId,
            @RequestParam(required = false) String nome
    ) {
        return subgrupoService.select(grupoId, nome);
    }

    @Operation(summary = "Busca subgrupo por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO', 'SUBGRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public ResponseEntity<SubgrupoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(subgrupoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo subgrupo")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO')")
    public ResponseEntity<SubgrupoResponseDto> create(@Valid @RequestBody SubgrupoCreateDto dto) {
        return new ResponseEntity<>(subgrupoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um subgrupo")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO')")
    public ResponseEntity<SubgrupoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody SubgrupoUpdateDto dto
    ) {
        return ResponseEntity.ok(subgrupoService.update(id, dto));
    }

    @Operation(summary = "Deleta um subgrupo")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'SUBGRUPO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subgrupoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
