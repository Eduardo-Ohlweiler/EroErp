package com.api.ero_erp.otorrino.controller;

import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoCreateDto;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoResponseDto;
import com.api.ero_erp.otorrino.dto.QuestionarioAplicadoSummaryDto;
import com.api.ero_erp.otorrino.dto.VincularConsultaDto;
import com.api.ero_erp.otorrino.service.QuestionarioAplicadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/otorrino/questionarios-aplicados")
@Tag(name = "Otorrino - Questionários Aplicados", description = "Aplicações de questionários com scoring automático")
public class QuestionarioAplicadoController {

    private final QuestionarioAplicadoService service;

    public QuestionarioAplicadoController(QuestionarioAplicadoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista questionários aplicados com paginação e filtros")
    public Page<QuestionarioAplicadoSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "dataAplicacao", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) String codigo
    ) {
        return service.getAll(pageable, pessoaId, codigo);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Busca questionário aplicado por ID")
    public ResponseEntity<QuestionarioAplicadoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getResponseById(id));
    }

    @GetMapping("/por-pessoa/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista questionários aplicados de uma pessoa")
    public List<QuestionarioAplicadoSummaryDto> getByPessoa(@PathVariable Long pessoaId) {
        return service.getByPessoa(pessoaId);
    }

    @GetMapping("/por-consulta/{consultaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista questionários aplicados vinculados a uma consulta")
    public List<QuestionarioAplicadoSummaryDto> getByConsulta(@PathVariable Long consultaId) {
        return service.getByConsulta(consultaId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Aplica um questionário (calcula o scoring no backend)")
    public ResponseEntity<QuestionarioAplicadoResponseDto> create(
            @Valid @RequestBody QuestionarioAplicadoCreateDto dto
    ) {
        return new ResponseEntity<>(service.criar(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/consulta")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Vincula ou desvincula a aplicação de uma consulta (consultaId nulo desvincula)")
    public ResponseEntity<QuestionarioAplicadoResponseDto> vincularConsulta(
            @PathVariable Long id,
            @RequestBody VincularConsultaDto dto
    ) {
        return ResponseEntity.ok(service.vincularConsulta(id, dto.consultaId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO')")
    @Operation(summary = "Remove questionário aplicado")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
