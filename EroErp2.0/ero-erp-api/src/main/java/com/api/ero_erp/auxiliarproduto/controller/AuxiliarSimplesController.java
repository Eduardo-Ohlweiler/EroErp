package com.api.ero_erp.auxiliarproduto.controller;

import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarRequestDto;
import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.AuxiliarSelectDto;
import com.api.ero_erp.auxiliarproduto.service.AuxiliarSimplesService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

/**
 * As rotas de grupo, categoria e marca — iguais, mudando só o caminho. Cada
 * concreto põe o {@code @RequestMapping}.
 *
 * <p>Tela {@code AUXILIARES_PRODUTO}: leitura nos GET, escrita no resto. O
 * {@code /select} é de qualquer autenticado: o cadastro de produto escolhe a
 * marca sem precisar da permissão dos auxiliares.
 */
@PreAuthorize("isAuthenticated()")
public abstract class AuxiliarSimplesController {

    private final AuxiliarSimplesService<?> service;

    protected AuxiliarSimplesController(AuxiliarSimplesService<?> service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_LER')")
    @Operation(summary = "Lista do tenant", description = "`termo` procura no nome, sem acento.")
    public ResponseEntity<Page<AuxiliarResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(service.getAll(pageable, termo, ativo));
    }

    @GetMapping("/select")
    @Operation(summary = "Ativos, para combo")
    public ResponseEntity<List<AuxiliarSelectDto>> select(@RequestParam(required = false) String termo) {
        return ResponseEntity.ok(service.select(termo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_LER')")
    @Operation(summary = "Detalha")
    public ResponseEntity<AuxiliarResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Cadastra")
    public ResponseEntity<AuxiliarResponseDto> create(@Valid @RequestBody AuxiliarRequestDto dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Altera o nome")
    public ResponseEntity<AuxiliarResponseDto> update(@PathVariable UUID id,
                                                      @Valid @RequestBody AuxiliarRequestDto dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Ativa ou inativa", description = "Não se apaga — inativa-se.")
    public ResponseEntity<AuxiliarResponseDto> alterarAtivo(@PathVariable UUID id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(service.alterarAtivo(id, ativo));
    }
}
