package com.api.ero_erp.ncm.controller;

import com.api.ero_erp.ncm.dtos.NcmCreateDto;
import com.api.ero_erp.ncm.dtos.NcmResponseDto;
import com.api.ero_erp.ncm.dtos.NcmUpdateDto;
import com.api.ero_erp.ncm.entity.Ncm;
import com.api.ero_erp.ncm.service.NcmService;
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

@RestController
@RequestMapping("/ncm")
@Tag(name = "NCM", description = "Consulta de códigos NCM")
public class NcmController {

    private final NcmService ncmService;

    public NcmController(NcmService ncmService) {
        this.ncmService = ncmService;
    }

    @Operation(
            summary = "Lista NCMs com paginação",
            description = "Exemplo: /ncm?busca=refrigerante&page=0&size=15"
    )
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public Page<NcmResponseDto> getAll(
            @PageableDefault(size = 15, sort = "codigo") Pageable pageable,
            @RequestParam(required = false) String busca
    ) {
        return ncmService.getAll(pageable, busca);
    }

    @Operation(summary = "Busca NCM por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public NcmResponseDto findById(@PathVariable Long id) {
        Ncm n = ncmService.findById(id);
        return new NcmResponseDto(n.getId(), n.getCodigo(), n.getDescricao(), n.getAtivo());
    }

    @Operation(summary = "Cria um NCM")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<NcmResponseDto> create(@Valid @RequestBody NcmCreateDto dto) {
        return new ResponseEntity<>(ncmService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um NCM")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<NcmResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody NcmUpdateDto dto
    ) {
        return ResponseEntity.ok(ncmService.update(id, dto));
    }

    @Operation(summary = "Exclui um NCM")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ncmService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
