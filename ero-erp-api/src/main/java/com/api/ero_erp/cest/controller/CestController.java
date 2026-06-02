package com.api.ero_erp.cest.controller;

import com.api.ero_erp.cest.dtos.CestCreateDto;
import com.api.ero_erp.cest.dtos.CestResponseDto;
import com.api.ero_erp.cest.dtos.CestUpdateDto;
import com.api.ero_erp.cest.entity.Cest;
import com.api.ero_erp.cest.service.CestService;
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
@RequestMapping("/cest")
@Tag(name = "CEST", description = "Consulta de códigos CEST para substituição tributária")
public class CestController {

    private final CestService cestService;

    public CestController(CestService cestService) {
        this.cestService = cestService;
    }

    @Operation(
            summary = "Lista CESTs com paginação, filtro por NCM e busca",
            description = "Exemplo: /cest?ncmId=1&busca=pneu&page=0&size=15"
    )
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public Page<CestResponseDto> getAll(
            @PageableDefault(size = 15, sort = "codigo") Pageable pageable,
            @RequestParam(required = false) Long   ncmId,
            @RequestParam(required = false) String busca
    ) {
        return cestService.getAll(pageable, ncmId, busca);
    }

    @Operation(summary = "Busca CEST por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public CestResponseDto findById(@PathVariable Long id) {
        Cest c = cestService.findById(id);
        return new CestResponseDto(c.getId(), c.getCodigo(), c.getDescricao(),
                c.getNcm().getId(), c.getNcm().getCodigo(), c.getNcm().getDescricao(), c.getAtivo());
    }

    @Operation(summary = "Cria um CEST")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<CestResponseDto> create(@Valid @RequestBody CestCreateDto dto) {
        return new ResponseEntity<>(cestService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um CEST")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<CestResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CestUpdateDto dto
    ) {
        return ResponseEntity.ok(cestService.update(id, dto));
    }

    @Operation(summary = "Exclui um CEST")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cestService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
