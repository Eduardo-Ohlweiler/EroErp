package com.api.ero_erp.marca.controller;

import com.api.ero_erp.marca.dtos.MarcaCreateDto;
import com.api.ero_erp.marca.dtos.MarcaResponseDto;
import com.api.ero_erp.marca.dtos.MarcaUpdateDto;
import com.api.ero_erp.marca.service.MarcaService;
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
@RequestMapping("/marcas")
@Tag(name = "Marcas", description = "Gerenciamento de marcas de produto por cliente")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService) {
        this.marcaService = marcaService;
    }

    @Operation(summary = "Lista marcas com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA', 'MARCA_GET', 'PRODUTO', 'PRODUTO_GET')")
    public Page<MarcaResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String  nome
    ) {
        return marcaService.getAll(pageable, ativo, nome);
    }

    @Operation(summary = "Lista marcas ativas para selects")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA', 'MARCA_GET', 'PRODUTO', 'PRODUTO_GET')")
    public List<MarcaResponseDto> select(
            @RequestParam(required = false) String nome
    ) {
        return marcaService.select(nome);
    }

    @Operation(summary = "Busca marca por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA', 'MARCA_GET', 'PRODUTO', 'PRODUTO_GET')")
    public ResponseEntity<MarcaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(marcaService.findByIdResponse(id));
    }

    @Operation(summary = "Cria uma nova marca")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA')")
    public ResponseEntity<MarcaResponseDto> create(@Valid @RequestBody MarcaCreateDto dto) {
        return new ResponseEntity<>(marcaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza uma marca")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA')")
    public ResponseEntity<MarcaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody MarcaUpdateDto dto
    ) {
        return ResponseEntity.ok(marcaService.update(id, dto));
    }

    @Operation(summary = "Deleta uma marca")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MARCA')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        marcaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
