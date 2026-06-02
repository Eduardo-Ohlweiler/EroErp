package com.api.ero_erp.produto.controller;

import com.api.ero_erp.produto.dtos.ProdutoCreateDto;
import com.api.ero_erp.produto.dtos.ProdutoResponseDto;
import com.api.ero_erp.produto.dtos.ProdutoUpdateDto;
import com.api.ero_erp.produto.service.ProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produtos")
@Tag(name = "Produtos", description = "Gerenciamento de produtos por cliente")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @Operation(
            summary = "Lista produtos com paginação e filtros",
            description = "Exemplo: /produtos?nome=agua&tipoProdutoId=1&bloqueado=false&page=0&size=15"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public Page<ProdutoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) Boolean bloqueado,
            @RequestParam(required = false) Long    tipoProdutoId,
            @RequestParam(required = false) Long    subgrupoId,
            @RequestParam(required = false) Long    categoriaId,
            @RequestParam(required = false) Long    marcaId,
            @RequestParam(required = false) String  nome
    ) {
        return produtoService.getAll(pageable, bloqueado, tipoProdutoId, subgrupoId, categoriaId, marcaId, nome);
    }

    @Operation(summary = "Lista produtos desbloqueados para selects")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public List<ProdutoResponseDto> select(
            @RequestParam(required = false) String nome
    ) {
        return produtoService.select(nome);
    }

    @Operation(summary = "Busca produto por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public ResponseEntity<ProdutoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo produto")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    public ResponseEntity<ProdutoResponseDto> create(@Valid @RequestBody ProdutoCreateDto dto) {
        return new ResponseEntity<>(produtoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um produto")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    public ResponseEntity<ProdutoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ProdutoUpdateDto dto
    ) {
        return ResponseEntity.ok(produtoService.update(id, dto));
    }

    @Operation(summary = "Deleta um produto")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        produtoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
