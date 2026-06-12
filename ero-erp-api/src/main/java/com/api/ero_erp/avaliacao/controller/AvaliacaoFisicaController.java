package com.api.ero_erp.avaliacao.controller;

import com.api.ero_erp.avaliacao.dto.*;
import com.api.ero_erp.avaliacao.service.AvaliacaoFisicaService;
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
import java.util.List;

@RestController
@RequestMapping("/avaliacoes-fisicas")
@Tag(name = "Avaliação Física", description = "Gerenciamento de avaliações físicas de alunos/pacientes")
public class AvaliacaoFisicaController {

    private final AvaliacaoFisicaService service;

    public AvaliacaoFisicaController(AvaliacaoFisicaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA', 'AVALIACAO_FISICA_GET')")
    @Operation(summary = "Lista avaliações físicas com paginação e filtros")
    public Page<AvaliacaoFisicaSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataAvaliacao") Pageable pageable,
            @RequestParam(required = false) Long      pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA', 'AVALIACAO_FISICA_GET')")
    @Operation(summary = "Busca avaliação física por ID com medidas e composição")
    public ResponseEntity<AvaliacaoFisicaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findByIdResponse(id));
    }

    @GetMapping("/evolucao/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA', 'AVALIACAO_FISICA_GET')")
    @Operation(summary = "Retorna histórico evolutivo de avaliações de uma pessoa, ordenado por data")
    public ResponseEntity<List<AvaliacaoFisicaSummaryDto>> getEvolucao(@PathVariable Long pessoaId) {
        return ResponseEntity.ok(service.getEvolucao(pessoaId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA')")
    @Operation(summary = "Cria nova avaliação física com medidas e composição corporal")
    public ResponseEntity<AvaliacaoFisicaResponseDto> create(
            @Valid @RequestBody AvaliacaoFisicaCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA')")
    @Operation(summary = "Atualiza avaliação física")
    public ResponseEntity<AvaliacaoFisicaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody AvaliacaoFisicaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'AVALIACAO_FISICA')")
    @Operation(summary = "Remove avaliação física")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
