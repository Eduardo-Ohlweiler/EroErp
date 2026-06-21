package com.api.ero_erp.otorrino.controller;

import com.api.ero_erp.otorrino.dto.AudiometriaCreateDto;
import com.api.ero_erp.otorrino.dto.AudiometriaResponseDto;
import com.api.ero_erp.otorrino.dto.AudiometriaSummaryDto;
import com.api.ero_erp.otorrino.dto.AudiometriaUpdateDto;
import com.api.ero_erp.otorrino.dto.VincularConsultaDto;
import com.api.ero_erp.otorrino.service.AudiometriaService;
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
@RequestMapping("/otorrino/audiometrias")
@Tag(name = "Otorrino - Audiometria", description = "Audiometrias com cálculo de grau e tipo de perda auditiva")
public class AudiometriaController {

    private final AudiometriaService service;

    public AudiometriaController(AudiometriaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista audiometrias com paginação e filtros")
    public Page<AudiometriaSummaryDto> getAll(
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
    @Operation(summary = "Busca audiometria por ID")
    public ResponseEntity<AudiometriaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getResponseById(id));
    }

    @GetMapping("/por-pessoa/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista audiometrias de uma pessoa (combo da consulta)")
    public List<AudiometriaSummaryDto> getByPessoa(@PathVariable Long pessoaId) {
        return service.getByPessoa(pessoaId);
    }

    @GetMapping("/por-consulta/{consultaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista audiometrias vinculadas a uma consulta")
    public List<AudiometriaSummaryDto> getByConsulta(@PathVariable Long consultaId) {
        return service.getByConsulta(consultaId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Cria nova audiometria")
    public ResponseEntity<AudiometriaResponseDto> create(@Valid @RequestBody AudiometriaCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Atualiza audiometria")
    public ResponseEntity<AudiometriaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody AudiometriaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PutMapping("/{id}/consulta")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Vincula ou desvincula a audiometria de uma consulta (consultaId nulo desvincula)")
    public ResponseEntity<AudiometriaResponseDto> vincularConsulta(
            @PathVariable Long id,
            @RequestBody VincularConsultaDto dto
    ) {
        return ResponseEntity.ok(service.vincularConsulta(id, dto.consultaId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Remove audiometria")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
