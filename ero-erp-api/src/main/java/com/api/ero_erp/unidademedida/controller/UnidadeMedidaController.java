package com.api.ero_erp.unidademedida.controller;

import com.api.ero_erp.unidademedida.dtos.UnidadeMedidaResponseDto;
import com.api.ero_erp.unidademedida.entity.UnidadeMedida;
import com.api.ero_erp.unidademedida.service.UnidadeMedidaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unidades-medida")
@Tag(name = "Unidades de Medida", description = "Lista global de unidades de medida")
public class UnidadeMedidaController {

    private final UnidadeMedidaService unidadeMedidaService;

    public UnidadeMedidaController(UnidadeMedidaService unidadeMedidaService) {
        this.unidadeMedidaService = unidadeMedidaService;
    }

    @Operation(summary = "Lista unidades de medida ativas")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public List<UnidadeMedidaResponseDto> findAtivas(
            @RequestParam(required = false) String busca
    ) {
        return unidadeMedidaService.findAtivas(busca);
    }

    @Operation(summary = "Busca unidade de medida por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO', 'PRODUTO_GET')")
    public UnidadeMedidaResponseDto findById(@PathVariable Long id) {
        UnidadeMedida u = unidadeMedidaService.findById(id);
        return new UnidadeMedidaResponseDto(u.getId(), u.getSigla(), u.getDescricao(), u.getAtivo());
    }
}
