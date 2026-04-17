package com.api.ero_erp.usuario.controller;

import com.api.ero_erp.usuario.dtos.UsuarioCreateDto;
import com.api.ero_erp.usuario.dtos.UsuarioResponseDto;
import com.api.ero_erp.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_erp.usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
@Tag(name = "Usuários", description = "Operações relacionadas a usuários")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Operation(summary = "Busca usuário por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<UsuarioResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo usuário para um cliente")
    @PostMapping("/cliente/{clienteId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<UsuarioResponseDto> create(
            @PathVariable Long clienteId,
            @Valid @RequestBody UsuarioCreateDto dto
    ) {
        return new ResponseEntity<>(usuarioService.create(clienteId, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente um usuário")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<UsuarioResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioUpdateDto dto
    ) {
        return ResponseEntity.ok(usuarioService.update(id, dto));
    }

    @Operation(summary = "Deleta um usuário")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        usuarioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}