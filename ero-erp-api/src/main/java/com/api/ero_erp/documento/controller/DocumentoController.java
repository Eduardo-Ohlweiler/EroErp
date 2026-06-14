package com.api.ero_erp.documento.controller;

import com.api.ero_erp.documento.dtos.DocumentoCreateDto;
import com.api.ero_erp.documento.dtos.DocumentoResponseDto;
import com.api.ero_erp.documento.dtos.DocumentoUpdateDto;
import com.api.ero_erp.documento.entity.DocumentoStatus;
import com.api.ero_erp.documento.service.DocumentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/documentos")
@Tag(name = "Documentos", description = "Emissão e gestão de documentos gerados a partir de modelos")
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @Operation(summary = "Lista documentos com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO', 'DOCUMENTO_GET')")
    public Page<DocumentoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "dataEmissao,desc") Pageable pageable,
            @RequestParam(required = false) Long            emitenteId,
            @RequestParam(required = false) String          clientePessoaNome,
            @RequestParam(required = false) DocumentoStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataEmissaoInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataEmissaoFim
    ) {
        return documentoService.getAll(pageable, emitenteId, clientePessoaNome, status, dataEmissaoInicio, dataEmissaoFim);
    }

    @Operation(summary = "Busca documento por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO', 'DOCUMENTO_GET')")
    public ResponseEntity<DocumentoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo documento a partir de um modelo")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO')")
    public ResponseEntity<DocumentoResponseDto> create(@Valid @RequestBody DocumentoCreateDto dto) {
        return new ResponseEntity<>(documentoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um documento em rascunho")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO')")
    public ResponseEntity<DocumentoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody DocumentoUpdateDto dto
    ) {
        return ResponseEntity.ok(documentoService.update(id, dto));
    }

    @Operation(summary = "Emite o documento (RASCUNHO → EMITIDO)")
    @PatchMapping("/{id}/emitir")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO')")
    public ResponseEntity<DocumentoResponseDto> emitir(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.emitir(id));
    }

    @Operation(summary = "Cancela o documento")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO')")
    public ResponseEntity<DocumentoResponseDto> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.cancelar(id));
    }
}
