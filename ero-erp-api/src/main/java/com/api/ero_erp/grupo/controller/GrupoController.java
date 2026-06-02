package com.api.ero_erp.grupo.controller;

import com.api.ero_erp.grupo.dtos.GrupoCreateDto;
import com.api.ero_erp.grupo.dtos.GrupoResponseDto;
import com.api.ero_erp.grupo.dtos.GrupoUpdateDto;
import com.api.ero_erp.grupo.service.GrupoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/grupos")
@Tag(name = "Grupos", description = "Gerenciamento de grupos de produto por cliente")
public class GrupoController {

    private final GrupoService grupoService;

    public GrupoController(GrupoService grupoService) {
        this.grupoService = grupoService;
    }

    @Operation(summary = "Lista grupos com paginação e filtros")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO', 'GRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public Page<GrupoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String  nome
    ) {
        return grupoService.getAll(pageable, ativo, nome);
    }

    @Operation(summary = "Lista grupos ativos para selects")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO', 'GRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public List<GrupoResponseDto> select(
            @RequestParam(required = false) String nome
    ) {
        return grupoService.select(nome);
    }

    @Operation(summary = "Busca grupo por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO', 'GRUPO_GET', 'PRODUTO', 'PRODUTO_GET')")
    public ResponseEntity<GrupoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(grupoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo grupo")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO')")
    public ResponseEntity<GrupoResponseDto> create(@Valid @RequestBody GrupoCreateDto dto) {
        return new ResponseEntity<>(grupoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um grupo")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO')")
    public ResponseEntity<GrupoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody GrupoUpdateDto dto
    ) {
        return ResponseEntity.ok(grupoService.update(id, dto));
    }

    @Operation(summary = "Deleta um grupo")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'GRUPO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        grupoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
