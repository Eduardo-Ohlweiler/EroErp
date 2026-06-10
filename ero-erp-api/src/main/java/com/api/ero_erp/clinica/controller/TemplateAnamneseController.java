package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.enums.TipoFinalidade;
import com.api.ero_erp.clinica.service.TemplateAnamneseService;
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
@RequestMapping("/templates-anamnese")
@Tag(name = "Clinica — Templates de Anamnese", description = "Gerenciamento de templates de fichas de anamnese")
public class TemplateAnamneseController {

    private final TemplateAnamneseService templateService;

    public TemplateAnamneseController(TemplateAnamneseService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Lista templates com paginação e filtros")
    public Page<TemplateAnamnesesSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String         nome,
            @RequestParam(required = false) TipoFinalidade finalidade
    ) {
        return templateService.getAll(pageable, nome, finalidade);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Busca template por ID com seus campos")
    public ResponseEntity<TemplateAnamneseResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.findByIdResponse(id));
    }

    @GetMapping("/por-finalidade/{finalidade}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Retorna o template ativo para a finalidade informada")
    public ResponseEntity<TemplateAnamneseResponseDto> getByFinalidade(
            @PathVariable TipoFinalidade finalidade
    ) {
        return ResponseEntity.ok(templateService.getByFinalidade(finalidade));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Cria novo template de anamnese")
    public ResponseEntity<TemplateAnamneseResponseDto> create(
            @Valid @RequestBody TemplateAnamneseCreateDto dto
    ) {
        return new ResponseEntity<>(templateService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Atualiza template de anamnese")
    public ResponseEntity<TemplateAnamneseResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody TemplateAnamneseUpdateDto dto
    ) {
        return ResponseEntity.ok(templateService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Remove template de anamnese")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/clonar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Clona um template de anamnese para o cliente atual")
    public ResponseEntity<TemplateAnamneseResponseDto> clonar(@PathVariable Long id) {
        return new ResponseEntity<>(templateService.clonar(id), HttpStatus.CREATED);
    }

    // ── Campos ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/campos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Adiciona campo ao template")
    public ResponseEntity<CampoAnamneseResponseDto> adicionarCampo(
            @PathVariable Long id,
            @Valid @RequestBody CampoAnamneseCreateDto dto
    ) {
        return new ResponseEntity<>(templateService.adicionarCampo(id, dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/campos/{campoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Atualiza campo do template")
    public ResponseEntity<CampoAnamneseResponseDto> atualizarCampo(
            @PathVariable Long id,
            @PathVariable Long campoId,
            @Valid @RequestBody CampoAnamneseCreateDto dto
    ) {
        return ResponseEntity.ok(templateService.atualizarCampo(id, campoId, dto));
    }

    @DeleteMapping("/{id}/campos/{campoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'TEMPLATE_ANAMNESE')")
    @Operation(summary = "Remove campo do template")
    public ResponseEntity<Void> removerCampo(
            @PathVariable Long id,
            @PathVariable Long campoId
    ) {
        templateService.removerCampo(id, campoId);
        return ResponseEntity.noContent().build();
    }
}
