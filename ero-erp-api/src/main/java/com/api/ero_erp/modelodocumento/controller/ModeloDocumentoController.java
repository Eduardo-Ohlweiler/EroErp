package com.api.ero_erp.modelodocumento.controller;

import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoCreateDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoResponseDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoSelectDto;
import com.api.ero_erp.modelodocumento.dtos.ModeloDocumentoUpdateDto;
import com.api.ero_erp.modelodocumento.service.ModeloDocumentoService;
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
@RequestMapping("/modelos-documento")
@Tag(name = "Modelos de Documento", description = "CRUD de modelos de documento")
public class ModeloDocumentoController {

    private final ModeloDocumentoService modeloDocumentoService;

    public ModeloDocumentoController(ModeloDocumentoService modeloDocumentoService) {
        this.modeloDocumentoService = modeloDocumentoService;
    }

    @Operation(summary = "Lista modelos de documento com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO', 'MODELO_DOCUMENTO_GET')")
    public Page<ModeloDocumentoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return modeloDocumentoService.getAll(pageable, nome, ativo);
    }

    @Operation(summary = "Lista modelos de documento para seleção (apenas ativos)")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO', 'MODELO_DOCUMENTO_GET')")
    public List<ModeloDocumentoSelectDto> select() {
        return modeloDocumentoService.getSelect();
    }

    @Operation(summary = "Busca modelo de documento por id para seleção")
    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO', 'MODELO_DOCUMENTO_GET')")
    public ResponseEntity<ModeloDocumentoSelectDto> selectById(@PathVariable Long id) {
        return ResponseEntity.ok(modeloDocumentoService.getSelectById(id));
    }

    @Operation(summary = "Busca modelo de documento por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO', 'MODELO_DOCUMENTO_GET')")
    public ResponseEntity<ModeloDocumentoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(modeloDocumentoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um modelo de documento")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO')")
    public ResponseEntity<ModeloDocumentoResponseDto> create(@Valid @RequestBody ModeloDocumentoCreateDto dto) {
        return new ResponseEntity<>(modeloDocumentoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um modelo de documento")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO')")
    public ResponseEntity<ModeloDocumentoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ModeloDocumentoUpdateDto dto
    ) {
        return ResponseEntity.ok(modeloDocumentoService.update(id, dto));
    }

    @Operation(summary = "Alterna o status ativo/inativo do modelo de documento")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MODELO_DOCUMENTO')")
    public ResponseEntity<ModeloDocumentoResponseDto> toggleAtivo(@PathVariable Long id) {
        return ResponseEntity.ok(modeloDocumentoService.toggleAtivo(id));
    }
}
