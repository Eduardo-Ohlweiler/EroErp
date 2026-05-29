package com.api.ero_erp.whatsapp.whatsappconfigglobal.controller;

import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalCreateDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalResponseDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.dtos.WhatsappConfigGlobalUpdateDto;
import com.api.ero_erp.whatsapp.whatsappconfigglobal.service.WhatsappConfigGlobalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/whatsapp/config-global")
@Tag(name = "WhatsApp Config Global", description = "Configuração global da API do WhatsApp")
public class WhatsappConfigGlobalController {

    private final WhatsappConfigGlobalService whatsappConfigGlobalService;

    public WhatsappConfigGlobalController(WhatsappConfigGlobalService whatsappConfigGlobalService) {
        this.whatsappConfigGlobalService = whatsappConfigGlobalService;
    }

    @Operation(summary = "Busca a configuração global ativa")
    @GetMapping("/ativa")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<WhatsappConfigGlobalResponseDto> findActive() {
        return ResponseEntity.ok(whatsappConfigGlobalService.findActive());
    }

    @Operation(summary = "Busca configuração global por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<WhatsappConfigGlobalResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(whatsappConfigGlobalService.findByIdResponse(id));
    }

    @Operation(summary = "Cria uma nova configuração global")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Configuração criada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<WhatsappConfigGlobalResponseDto> create(@Valid @RequestBody WhatsappConfigGlobalCreateDto dto) {
        return new ResponseEntity<>(whatsappConfigGlobalService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza a configuração global")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<WhatsappConfigGlobalResponseDto> update(
            @PathVariable       Long                         id,
            @Valid @RequestBody WhatsappConfigGlobalUpdateDto dto
    ) {
        return ResponseEntity.ok(whatsappConfigGlobalService.update(id, dto));
    }

    @Operation(summary = "Deleta a configuração global")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        whatsappConfigGlobalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
