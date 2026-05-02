package com.api.ero_erp.estado.controller;

import com.api.ero_erp.estado.dtos.EstadoCreateDto;
import com.api.ero_erp.estado.dtos.EstadoUpdateDto;
import com.api.ero_erp.estado.entity.Estado;
import com.api.ero_erp.estado.service.EstadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@RequestMapping("/estados")
@Tag(name = "Estados", description = "Operações relacionadas a estados")
public class EstadoController {

    private final EstadoService estadoService;

    public EstadoController(EstadoService estadoService) {
        this.estadoService = estadoService;
    }

    @Operation(summary = "Listar para select", description = "Retorna lista simples de estados (ativo = true)")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTADO', 'ESTADO_GET')")
    public List<Estado> findForSelect() {
        return estadoService.findForSelect();
    }

    @Operation(summary = "Busca estado por id")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTADO', 'ESTADO_GET')")
    public Estado findById(@PathVariable Long id) {
        return estadoService.findById(id);
    }

    @Operation(summary = "Cria um novo estado")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Criado com sucesso"),
            @ApiResponse(responseCode = "409", description = "Conflito (ex: nome já existente)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Estado> create(@Valid @RequestBody EstadoCreateDto dto) {
        return new ResponseEntity<>(estadoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente um estado")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Estado> update(
            @PathVariable Long id,
            @Valid @RequestBody EstadoUpdateDto dto
    ) {
        return ResponseEntity.ok(estadoService.update(id, dto));
    }

    @Operation(summary = "Listar estados", description = "Retorna lista paginada de estados")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTADO', 'ESTADO_GET')")
    public Page<Estado> getAll(

            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,

            @Parameter(description = "Filtro por nome")
            @RequestParam(required = false) String nome,

            @Parameter(description = "Filtro por sigla")
            @RequestParam(required = false) String sigla,

            @Parameter(description = "Filtro por código IBGE")
            @RequestParam(required = false) Integer codigoIbge,

            @Parameter(description = "Filtro por ativo")
            @RequestParam(required = false) Boolean ativo
    ) {
        return estadoService.getAll(pageable, nome, sigla, codigoIbge, ativo);
    }
}