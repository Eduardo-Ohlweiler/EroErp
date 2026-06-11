package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dto.RefeicaoCreateDto;
import com.api.ero_erp.clinica.dto.RefeicaoResponseDto;
import com.api.ero_erp.clinica.dto.RefeicaoSummaryDto;
import com.api.ero_erp.clinica.service.RefeicaoService;
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
@RequestMapping("/refeicoes")
@Tag(name = "Clinica — Refeições", description = "Gerenciamento de tipos de refeição para planos alimentares")
public class RefeicaoController {

    private final RefeicaoService refeicaoService;

    public RefeicaoController(RefeicaoService refeicaoService) {
        this.refeicaoService = refeicaoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO', 'REFEICAO_GET')")
    @Operation(summary = "Lista refeições com paginação e filtro por nome")
    public Page<RefeicaoSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome
    ) {
        return refeicaoService.getAll(pageable, nome);
    }

    @GetMapping("/ativas")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO', 'REFEICAO_GET', 'PLANO_ALIMENTAR', 'PLANO_ALIMENTAR_GET')")
    @Operation(summary = "Lista refeições ativas para uso em dropdowns")
    public ResponseEntity<List<RefeicaoSummaryDto>> findAtivas() {
        return ResponseEntity.ok(refeicaoService.findAtivas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO', 'REFEICAO_GET', 'PLANO_ALIMENTAR', 'PLANO_ALIMENTAR_GET')")
    @Operation(summary = "Busca refeição por ID")
    public ResponseEntity<RefeicaoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(refeicaoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO')")
    @Operation(summary = "Cria nova refeição")
    public ResponseEntity<RefeicaoResponseDto> create(
            @Valid @RequestBody RefeicaoCreateDto dto
    ) {
        return new ResponseEntity<>(refeicaoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO')")
    @Operation(summary = "Atualiza refeição")
    public ResponseEntity<RefeicaoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody RefeicaoCreateDto dto
    ) {
        return ResponseEntity.ok(refeicaoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'REFEICAO')")
    @Operation(summary = "Remove refeição")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        refeicaoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
