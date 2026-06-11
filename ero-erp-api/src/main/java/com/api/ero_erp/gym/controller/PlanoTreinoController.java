package com.api.ero_erp.gym.controller;

import com.api.ero_erp.gym.dto.*;
import com.api.ero_erp.gym.service.PlanoTreinoService;
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
@RequestMapping("/planos-treino")
@Tag(name = "Gym — Planos de Treino", description = "Gerenciamento de planos de treino e seus itens")
public class PlanoTreinoController {

    private final PlanoTreinoService planoService;

    public PlanoTreinoController(PlanoTreinoService planoService) {
        this.planoService = planoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO', 'PLANO_TREINO_GET')")
    @Operation(summary = "Lista planos de treino com paginação e filtros")
    public Page<PlanoTreinoSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Long   pessoaId
    ) {
        return planoService.getAll(pageable, nome, pessoaId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO', 'PLANO_TREINO_GET')")
    @Operation(summary = "Busca plano de treino por ID com todos os itens")
    public ResponseEntity<PlanoTreinoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(planoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Cria novo plano de treino")
    public ResponseEntity<PlanoTreinoResponseDto> create(
            @Valid @RequestBody PlanoTreinoCreateDto dto
    ) {
        return new ResponseEntity<>(planoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Atualiza plano de treino")
    public ResponseEntity<PlanoTreinoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody PlanoTreinoUpdateDto dto
    ) {
        return ResponseEntity.ok(planoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Remove plano de treino")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        planoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/clonar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PlanoTreinoResponseDto> clonar(@PathVariable Long id) {
        return new ResponseEntity<>(planoService.clonar(id), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/enviar-pdf")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO', 'PLANO_TREINO_GET')")
    @Operation(summary = "Envia PDF do plano de treino via WhatsApp para o aluno")
    public ResponseEntity<Void> enviarPdfWhatsapp(
            @PathVariable Long id,
            @Valid @RequestBody EnviarPdfTreinoDto dto
    ) {
        planoService.enviarPdfWhatsapp(id, dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/itens")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Adiciona item ao plano de treino")
    public ResponseEntity<ItemPlanoTreinoResponseDto> adicionarItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemPlanoTreinoDto dto
    ) {
        return new ResponseEntity<>(planoService.adicionarItem(id, dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Atualiza item do plano de treino")
    public ResponseEntity<ItemPlanoTreinoResponseDto> atualizarItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody ItemPlanoTreinoDto dto
    ) {
        return ResponseEntity.ok(planoService.atualizarItem(id, itemId, dto));
    }

    @DeleteMapping("/{id}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PLANO_TREINO')")
    @Operation(summary = "Remove item do plano de treino")
    public ResponseEntity<Void> removerItem(
            @PathVariable Long id,
            @PathVariable Long itemId
    ) {
        planoService.removerItem(id, itemId);
        return ResponseEntity.noContent().build();
    }
}
