package com.api.ero_erp.tipoproduto.controller;

import com.api.ero_erp.tipoproduto.dtos.TipoProdutoResponseDto;
import com.api.ero_erp.tipoproduto.entity.TipoProduto;
import com.api.ero_erp.tipoproduto.service.TipoProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tipos-produto")
@Tag(name = "Tipos de Produto", description = "Lista global de tipos de produto")
public class TipoProdutoController {

    private final TipoProdutoService tipoProdutoService;

    public TipoProdutoController(TipoProdutoService tipoProdutoService) {
        this.tipoProdutoService = tipoProdutoService;
    }

    @Operation(summary = "Lista tipos de produto ativos")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public List<TipoProdutoResponseDto> findAtivos(
            @RequestParam(required = false) String nome
    ) {
        return tipoProdutoService.findAtivos(nome);
    }

    @Operation(summary = "Busca tipo de produto por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public TipoProdutoResponseDto findById(@PathVariable Long id) {
        TipoProduto t = tipoProdutoService.findById(id);
        return new TipoProdutoResponseDto(t.getId(), t.getNome(), t.getAtivo());
    }
}
