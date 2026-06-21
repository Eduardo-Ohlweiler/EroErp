package com.api.ero_erp.otorrino.controller;

import com.api.ero_erp.otorrino.dto.ExameLaudoCreateDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoResponseDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoSummaryDto;
import com.api.ero_erp.otorrino.dto.ExameLaudoUpdateDto;
import com.api.ero_erp.otorrino.dto.VincularConsultaDto;
import com.api.ero_erp.otorrino.enums.TipoExameLaudo;
import com.api.ero_erp.otorrino.service.ExameLaudoService;
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
@RequestMapping("/otorrino/exames-laudo")
@Tag(name = "Otorrino - Exames/Laudos", description = "Laudos descritivos (nasofibroscopia, laringoscopia, etc.)")
public class ExameLaudoController {

    private final ExameLaudoService service;

    public ExameLaudoController(ExameLaudoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista exames/laudos com paginação e filtros")
    public Page<ExameLaudoSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataExame", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) TipoExameLaudo tipoExame,
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, pessoaId, dataInicio, dataFim, tipoExame, nome);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Busca exame/laudo por ID")
    public ResponseEntity<ExameLaudoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getResponseById(id));
    }

    @GetMapping("/por-pessoa/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista exames/laudos de uma pessoa")
    public List<ExameLaudoSummaryDto> getByPessoa(@PathVariable Long pessoaId) {
        return service.getByPessoa(pessoaId);
    }

    @GetMapping("/por-consulta/{consultaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista exames/laudos vinculados a uma consulta")
    public List<ExameLaudoSummaryDto> getByConsulta(@PathVariable Long consultaId) {
        return service.getByConsulta(consultaId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Cria novo exame/laudo")
    public ResponseEntity<ExameLaudoResponseDto> create(@Valid @RequestBody ExameLaudoCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Atualiza exame/laudo")
    public ResponseEntity<ExameLaudoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ExameLaudoUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PutMapping("/{id}/consulta")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Vincula ou desvincula o exame/laudo de uma consulta (consultaId nulo desvincula)")
    public ResponseEntity<ExameLaudoResponseDto> vincularConsulta(
            @PathVariable Long id,
            @RequestBody VincularConsultaDto dto
    ) {
        return ResponseEntity.ok(service.vincularConsulta(id, dto.consultaId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Remove exame/laudo")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
