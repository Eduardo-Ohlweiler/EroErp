package com.api.ero_erp.otorrino.controller;

import com.api.ero_erp.otorrino.dto.ImitanciometriaCreateDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaResponseDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaSummaryDto;
import com.api.ero_erp.otorrino.dto.ImitanciometriaUpdateDto;
import com.api.ero_erp.otorrino.dto.VincularConsultaDto;
import com.api.ero_erp.otorrino.service.ImitanciometriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/otorrino/imitanciometrias")
@Tag(name = "Otorrino - Imitanciometria", description = "Imitanciometrias (timpanometria e reflexos estapédicos)")
public class ImitanciometriaController {

    private final ImitanciometriaService service;

    public ImitanciometriaController(ImitanciometriaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista imitanciometrias com paginação e filtros")
    public Page<ImitanciometriaSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataExame", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim, nome);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Busca imitanciometria por ID")
    public ResponseEntity<ImitanciometriaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getResponseById(id));
    }

    @GetMapping("/por-pessoa/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista imitanciometrias de uma pessoa")
    public List<ImitanciometriaSummaryDto> getByPessoa(@PathVariable Long pessoaId) {
        return service.getByPessoa(pessoaId);
    }

    @GetMapping("/por-consulta/{consultaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista imitanciometrias vinculadas a uma consulta")
    public List<ImitanciometriaSummaryDto> getByConsulta(@PathVariable Long consultaId) {
        return service.getByConsulta(consultaId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Cria nova imitanciometria")
    public ResponseEntity<ImitanciometriaResponseDto> create(@Valid @RequestBody ImitanciometriaCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Atualiza imitanciometria")
    public ResponseEntity<ImitanciometriaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ImitanciometriaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PutMapping("/{id}/consulta")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Vincula ou desvincula a imitanciometria de uma consulta (consultaId nulo desvincula)")
    public ResponseEntity<ImitanciometriaResponseDto> vincularConsulta(
            @PathVariable Long id,
            @RequestBody VincularConsultaDto dto
    ) {
        return ResponseEntity.ok(service.vincularConsulta(id, dto.consultaId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Remove imitanciometria")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
