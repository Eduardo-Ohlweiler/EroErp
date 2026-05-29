package com.api.ero_erp.whatsapp.whatsappinstancia.controller;

import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaCreateDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaResponseDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.dtos.WhatsappInstanciaUpdateDto;
import com.api.ero_erp.whatsapp.whatsappinstancia.service.WhatsappInstanciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/whatsapp/instancias")
@Tag(name = "WhatsApp Instâncias", description = "Gerenciamento de instâncias (números) do WhatsApp por cliente")
public class WhatsappInstanciaController {

    private final WhatsappInstanciaService whatsappInstanciaService;

    public WhatsappInstanciaController(WhatsappInstanciaService whatsappInstanciaService) {
        this.whatsappInstanciaService = whatsappInstanciaService;
    }

    @Operation(
            summary = "Lista as instâncias ativas do cliente",
            description = "Exemplo: /whatsapp/instancias"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public List<WhatsappInstanciaResponseDto> getAll() {
        return whatsappInstanciaService.getAll();
    }

    @Operation(summary = "Busca instância por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(whatsappInstanciaService.findByIdResponse(id));
    }

    @Operation(summary = "Cria uma nova instância do WhatsApp para o cliente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Instância criada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> create(@Valid @RequestBody WhatsappInstanciaCreateDto dto) {
        return new ResponseEntity<>(whatsappInstanciaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza a instância do WhatsApp")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> update(
            @PathVariable       Long                      id,
            @Valid @RequestBody WhatsappInstanciaUpdateDto dto
    ) {
        return ResponseEntity.ok(whatsappInstanciaService.update(id, dto));
    }

    @Operation(summary = "Deleta a instância do WhatsApp")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        whatsappInstanciaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
