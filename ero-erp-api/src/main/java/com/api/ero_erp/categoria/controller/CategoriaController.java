package com.api.ero_erp.categoria.controller;

import com.api.ero_erp.categoria.dtos.CategoriaCreateDto;
import com.api.ero_erp.categoria.dtos.CategoriaResponseDto;
import com.api.ero_erp.categoria.dtos.CategoriaUpdateDto;
import com.api.ero_erp.categoria.service.CategoriaService;
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
@RequestMapping("/categorias")
@Tag(name = "Categorias", description = "Gerenciamento de categorias de produto por cliente")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @Operation(summary = "Lista categorias com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CATEGORIA', 'CATEGORIA_GET', 'PRODUTO', 'PRODUTO_GET')")
    public Page<CategoriaResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String  nome
    ) {
        return categoriaService.getAll(pageable, ativo, nome);
    }

    @Operation(summary = "Lista categorias ativas para selects")
    @GetMapping("/select")
    @PreAuthorize("isAuthenticated()")
    public List<CategoriaResponseDto> select(
            @RequestParam(required = false) String nome
    ) {
        return categoriaService.select(nome);
    }

    @Operation(summary = "Busca categoria por id por select")
    @GetMapping("/select/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CategoriaResponseDto> selectById(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.findByIdResponse(id));
    }

    @Operation(summary = "Busca categoria por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CATEGORIA', 'CATEGORIA_GET', 'PRODUTO', 'PRODUTO_GET')")
    public ResponseEntity<CategoriaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.findByIdResponse(id));
    }

    @Operation(summary = "Cria uma nova categoria")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CATEGORIA')")
    public ResponseEntity<CategoriaResponseDto> create(@Valid @RequestBody CategoriaCreateDto dto) {
        return new ResponseEntity<>(categoriaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza uma categoria")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CATEGORIA')")
    public ResponseEntity<CategoriaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaUpdateDto dto
    ) {
        return ResponseEntity.ok(categoriaService.update(id, dto));
    }

    @Operation(summary = "Deleta uma categoria")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CATEGORIA')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        categoriaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
