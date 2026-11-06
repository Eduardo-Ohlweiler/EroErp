package com.api.ero_api.sessao.controller;

import com.api.ero_api.sessao.dtos.SessaoResponseDto;
import com.api.ero_api.sessao.service.SessaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessoes")
@Tag(name = "Sessões", description = "Navegadores em que o usuário está logado")
public class SessaoController {

    private final SessaoService service;

    public SessaoController(SessaoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Lista as minhas sessões abertas")
    public List<SessaoResponseDto> listarMinhas() {
        return service.listarMinhas();
    }

    @PatchMapping("/{id}/encerrar")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Encerra uma das minhas sessões")
    public ResponseEntity<Void> encerrar(@PathVariable UUID id) {
        service.encerrarMinha(id);
        return ResponseEntity.noContent().build();
    }
}
