package com.api.ero_erp.origemproduto.controller;

import com.api.ero_erp.origemproduto.dtos.OrigemProdutoResponseDto;
import com.api.ero_erp.origemproduto.entity.OrigemProduto;
import com.api.ero_erp.origemproduto.service.OrigemProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/origens-produto")
@Tag(name = "Origens de Produto", description = "Lista global de origens de produto (fiscal)")
public class OrigemProdutoController {

    private final OrigemProdutoService origemProdutoService;

    public OrigemProdutoController(OrigemProdutoService origemProdutoService) {
        this.origemProdutoService = origemProdutoService;
    }

    @Operation(summary = "Lista todas as origens de produto")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public List<OrigemProdutoResponseDto> findAll() {
        return origemProdutoService.findAll();
    }

    @Operation(summary = "Busca origem de produto por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public OrigemProdutoResponseDto findById(@PathVariable Long id) {
        OrigemProduto o = origemProdutoService.findById(id);
        return new OrigemProdutoResponseDto(o.getId(), o.getCodigo(), o.getDescricao());
    }
}
