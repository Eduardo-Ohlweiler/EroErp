package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.enums.TipoFinalidade;
import com.api.ero_erp.clinica.service.FichaAnamneseService;
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
@RequestMapping("/fichas-anamnese")
@Tag(name = "Clinica — Fichas de Anamnese", description = "Gerenciamento de fichas de anamnese preenchidas")
public class FichaAnamneseController {

    private final FichaAnamneseService fichaService;

    public FichaAnamneseController(FichaAnamneseService fichaService) {
        this.fichaService = fichaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Lista fichas de anamnese com paginação e filtros")
    public Page<FichaAnamnesesSummaryDto> getAll(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) Long           pessoaId,
            @RequestParam(required = false) TipoFinalidade finalidade
    ) {
        return fichaService.getAll(pageable, pessoaId, finalidade);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Busca ficha de anamnese por ID com respostas")
    public ResponseEntity<FichaAnamneseResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(fichaService.findByIdResponse(id));
    }

    @GetMapping("/por-pessoa/{pessoaId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Lista fichas de uma pessoa para dropdown")
    public ResponseEntity<List<FichaAnamnesesSummaryDto>> findByPessoa(
            @PathVariable Long pessoaId
    ) {
        return ResponseEntity.ok(fichaService.findByPessoa(pessoaId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE')")
    @Operation(summary = "Cria nova ficha de anamnese")
    public ResponseEntity<FichaAnamneseResponseDto> create(
            @Valid @RequestBody FichaAnamneseCreateDto dto
    ) {
        return new ResponseEntity<>(fichaService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE')")
    @Operation(summary = "Atualiza ficha de anamnese e substitui todas as respostas")
    public ResponseEntity<FichaAnamneseResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody FichaAnamneseUpdateDto dto
    ) {
        return ResponseEntity.ok(fichaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE')")
    @Operation(summary = "Remove ficha de anamnese")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        fichaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enviar-pdf")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ANAMNESE', 'ANAMNESE_GET')")
    @Operation(summary = "Envia PDF da ficha via WhatsApp para o paciente")
    public ResponseEntity<Void> enviarPdfWhatsapp(
            @PathVariable Long id,
            @Valid @RequestBody EnviarPdfFichaDto dto
    ) {
        fichaService.enviarPdfWhatsapp(id, dto);
        return ResponseEntity.ok().build();
    }
}
