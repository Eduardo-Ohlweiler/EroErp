package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.service.PlanoAlimentarService;
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
@RequestMapping("/planos-alimentares")
@Tag(name = "Clinica — Planos Alimentares", description = "Gerenciamento de planos alimentares e seus itens")
public class PlanoAlimentarController {

    private final PlanoAlimentarService planoService;

    public PlanoAlimentarController(PlanoAlimentarService planoService) {
        this.planoService = planoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR', 'PLANO_ALIMENTAR_GET')")
    @Operation(summary = "Lista planos alimentares com paginação e filtros")
    public Page<PlanoAlimentarSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Long   pessoaId
    ) {
        return planoService.getAll(pageable, nome, pessoaId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR', 'PLANO_ALIMENTAR_GET')")
    @Operation(summary = "Busca plano alimentar por ID com todos os itens")
    public ResponseEntity<PlanoAlimentarResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(planoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Cria novo plano alimentar")
    public ResponseEntity<PlanoAlimentarResponseDto> create(
            @Valid @RequestBody PlanoAlimentarCreateDto dto
    ) {
        return new ResponseEntity<>(planoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Atualiza plano alimentar")
    public ResponseEntity<PlanoAlimentarResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody PlanoAlimentarUpdateDto dto
    ) {
        return ResponseEntity.ok(planoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Remove plano alimentar")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        planoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enviar-pdf")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR', 'PLANO_ALIMENTAR_GET')")
    @Operation(summary = "Envia PDF do plano alimentar via WhatsApp para o paciente")
    public ResponseEntity<Void> enviarPdfWhatsapp(
            @PathVariable Long id,
            @Valid @RequestBody EnviarPdfPlanoDto dto
    ) {
        planoService.enviarPdfWhatsapp(id, dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/itens")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Adiciona item ao plano alimentar")
    public ResponseEntity<ItemPlanoAlimentarResponseDto> adicionarItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemPlanoAlimentarDto dto
    ) {
        return new ResponseEntity<>(planoService.adicionarItem(id, dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Atualiza item do plano alimentar")
    public ResponseEntity<ItemPlanoAlimentarResponseDto> atualizarItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody ItemPlanoAlimentarDto dto
    ) {
        return ResponseEntity.ok(planoService.atualizarItem(id, itemId, dto));
    }

    @DeleteMapping("/{id}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_ALIMENTAR')")
    @Operation(summary = "Remove item do plano alimentar")
    public ResponseEntity<Void> removerItem(
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        planoService.removerItem(id, itemId);
        return ResponseEntity.noContent().build();
    }
}
