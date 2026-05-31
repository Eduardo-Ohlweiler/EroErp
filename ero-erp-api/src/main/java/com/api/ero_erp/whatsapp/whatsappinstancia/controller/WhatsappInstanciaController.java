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
            description = "Retorna todas as instâncias ativas vinculadas ao cliente logado"
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

    @Operation(
            summary = "Busca instância por ID",
            description = "Retorna os dados de uma instância específica vinculada ao cliente logado"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Instância encontrada"),
            @ApiResponse(responseCode = "404", description = "Instância não encontrada"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(whatsappInstanciaService.findByIdResponse(id));
    }

    @Operation(
            summary = "Cria uma nova instância do WhatsApp",
            description = "Cria uma instância vinculada a um usuário do cliente. Cada usuário pode ter apenas uma instância."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Instância criada com sucesso"),
            @ApiResponse(responseCode = "409", description = "Usuário já possui uma instância ou instanceName duplicado"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> create(@Valid @RequestBody WhatsappInstanciaCreateDto dto) {
        return new ResponseEntity<>(whatsappInstanciaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(
            summary = "Atualiza uma instância do WhatsApp",
            description = "Atualiza os dados de uma instância. Se o usuário for alterado, valida se o novo usuário já possui instância."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Instância atualizada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Instância não encontrada"),
            @ApiResponse(responseCode = "409", description = "Novo usuário já possui uma instância configurada"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<WhatsappInstanciaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody WhatsappInstanciaUpdateDto dto
    ) {
        return ResponseEntity.ok(whatsappInstanciaService.update(id, dto));
    }

    @Operation(
            summary = "Deleta uma instância do WhatsApp",
            description = "Remove permanentemente a instância vinculada ao cliente logado"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Instância deletada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Instância não encontrada"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        whatsappInstanciaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
