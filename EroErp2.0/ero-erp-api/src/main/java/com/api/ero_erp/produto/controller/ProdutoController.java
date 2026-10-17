package com.api.ero_erp.produto.controller;

import com.api.ero_erp.produto.dtos.ProdutoRequestDto;
import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.dtos.ProdutoSelectDto;
import com.api.ero_erp.produto.service.ProdutoService;
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

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * Cadastro de produtos — tela {@code PRODUTOS}: leitura nos GET, escrita no
 * resto. ADMIN e SUPERADMIN têm as duas.
 *
 * <p>O {@code isAuthenticated()} da classe fica para o {@code /select}: o
 * estoque (e o pedido, quando vier) escolhe o produto num combo sem precisar
 * da permissão do cadastro — e o combo não traz custo.
 */
@RestController
@RequestMapping("/produtos")
@RequiredArgsConstructor
@Tag(name = "Produtos")
@PreAuthorize("isAuthenticated()")
public class ProdutoController {

    private final ProdutoService produtoService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUTOS_LER')")
    @Operation(summary = "Lista os produtos do tenant",
            description = """
                    `termo` procura no nome e, quando é número, no código e no EAN exatos.
                    `grupoId` traz os produtos de qualquer subgrupo do grupo.""")
    public ResponseEntity<Page<ProdutoResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) UUID grupoId,
            @RequestParam(required = false) UUID subgrupoId,
            @RequestParam(required = false) UUID categoriaId,
            @RequestParam(required = false) UUID marcaId,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(produtoService.getAll(pageable, termo, grupoId, subgrupoId,
                categoriaId, marcaId, ativo));
    }

    @GetMapping("/select")
    @Operation(summary = "Produtos ativos para combo", description = "Por nome, código ou EAN. Sem custo.")
    public ResponseEntity<List<ProdutoSelectDto>> select(@RequestParam(required = false) String termo) {
        return ResponseEntity.ok(produtoService.select(termo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUTOS_LER')")
    @Operation(summary = "Detalha um produto")
    public ResponseEntity<ProdutoResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(produtoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUTOS_ESCREVER')")
    @Operation(summary = "Cadastra um produto", description = "O código é gerado pelo sistema.")
    public ResponseEntity<ProdutoResponseDto> create(@Valid @RequestBody ProdutoRequestDto dto) {
        ProdutoResponseDto criado = produtoService.create(dto);
        return ResponseEntity.created(URI.create("/produtos/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUTOS_ESCREVER')")
    @Operation(summary = "Altera um produto")
    public ResponseEntity<ProdutoResponseDto> update(@PathVariable UUID id,
                                                     @Valid @RequestBody ProdutoRequestDto dto) {
        return ResponseEntity.ok(produtoService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('PRODUTOS_ESCREVER')")
    @Operation(summary = "Ativa ou inativa um produto", description = "Produto não se apaga — inativa-se.")
    public ResponseEntity<ProdutoResponseDto> alterarAtivo(@PathVariable UUID id,
                                                           @RequestParam boolean ativo) {
        return ResponseEntity.ok(produtoService.alterarAtivo(id, ativo));
    }
}
