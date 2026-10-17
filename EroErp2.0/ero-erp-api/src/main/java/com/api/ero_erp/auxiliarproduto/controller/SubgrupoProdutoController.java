package com.api.ero_erp.auxiliarproduto.controller;

import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoRequestDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoResponseDto;
import com.api.ero_erp.auxiliarproduto.dtos.SubgrupoSelectDto;
import com.api.ero_erp.auxiliarproduto.service.SubgrupoProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Subgrupos de produto — tela {@code AUXILIARES_PRODUTO}, como grupo,
 * categoria e marca. O {@code /select} é de qualquer autenticado.
 */
@RestController
@RequestMapping("/subgrupos-produto")
@RequiredArgsConstructor
@Tag(name = "Subgrupos de produto")
@PreAuthorize("isAuthenticated()")
public class SubgrupoProdutoController {

    private final SubgrupoProdutoService subgrupoService;

    @GetMapping
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_LER')")
    @Operation(summary = "Lista do tenant", description = "`termo` procura no nome do subgrupo e no do grupo.")
    public ResponseEntity<Page<SubgrupoResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) UUID grupoId,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(subgrupoService.getAll(pageable, termo, grupoId, ativo));
    }

    @GetMapping("/select")
    @Operation(summary = "Subgrupos ativos de grupos ativos, para combo")
    public ResponseEntity<List<SubgrupoSelectDto>> select(@RequestParam(required = false) String termo,
                                                          @RequestParam(required = false) UUID grupoId) {
        return ResponseEntity.ok(subgrupoService.select(termo, grupoId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_LER')")
    @Operation(summary = "Detalha")
    public ResponseEntity<SubgrupoResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(subgrupoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Cadastra")
    public ResponseEntity<SubgrupoResponseDto> create(@Valid @RequestBody SubgrupoRequestDto dto) {
        return ResponseEntity.status(201).body(subgrupoService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Altera nome e grupo", description = "Os produtos do subgrupo vão junto para o grupo novo.")
    public ResponseEntity<SubgrupoResponseDto> update(@PathVariable UUID id,
                                                      @Valid @RequestBody SubgrupoRequestDto dto) {
        return ResponseEntity.ok(subgrupoService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('AUXILIARES_PRODUTO_ESCREVER')")
    @Operation(summary = "Ativa ou inativa", description = "Não se apaga — inativa-se.")
    public ResponseEntity<SubgrupoResponseDto> alterarAtivo(@PathVariable UUID id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(subgrupoService.alterarAtivo(id, ativo));
    }
}
