package com.api.ero_erp.cidade.controller;

import com.api.ero_erp.cidade.dtos.CidadeCreateDto;
import com.api.ero_erp.cidade.dtos.CidadeResponseDto;
import com.api.ero_erp.cidade.dtos.CidadeUpdateDto;
import com.api.ero_erp.cidade.service.CidadeService;
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
@RequestMapping("/cidades")
@Tag(name = "Cidades", description = "Operações relacionadas a cidades")
public class CidadeController {

    private final CidadeService cidadeService;

    public CidadeController(CidadeService cidadeService) {
        this.cidadeService = cidadeService;
    }

    @Operation(summary = "Lista cidades para seleção")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CIDADE', 'CIDADE_GET')")
    public List<CidadeResponseDto> findForSelect(
            @RequestParam(required = false) String nome
    ) {
        return cidadeService.findForSelect(nome);
    }

    @Operation(summary = "Busca cidade por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CIDADE', 'CIDADE_GET')")
    public CidadeResponseDto findById(@PathVariable Long id) {
        return cidadeService.findByIdResponse(id);
    }

    @Operation(summary = "Lista cidades com filtros e paginação")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CIDADE', 'CIDADE_GET')")
    public Page<CidadeResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) Long    estadoId,
            @RequestParam(required = false) Integer codigoIbge,
            @RequestParam(required = false) Boolean ativo
    ) {
        return cidadeService.getAll(pageable, nome, estadoId, codigoIbge, ativo);
    }

    @Operation(summary = "Cria uma nova cidade")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CIDADE', 'CIDADE_POST')")
    public ResponseEntity<CidadeResponseDto> create(
            @Valid @RequestBody CidadeCreateDto dto
    ) {
        return new ResponseEntity<>(cidadeService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente uma cidade")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CIDADE', 'CIDADE_POST')")
    public ResponseEntity<CidadeResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CidadeUpdateDto dto
    ) {
        return ResponseEntity.ok(cidadeService.update(id, dto));
    }
}