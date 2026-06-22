package com.api.ero_erp.pedido.controller;

import com.api.ero_erp.pedido.dtos.TipoPedidoCreateDto;
import com.api.ero_erp.pedido.dtos.TipoPedidoResponseDto;
import com.api.ero_erp.pedido.dtos.TipoPedidoSummaryDto;
import com.api.ero_erp.pedido.service.TipoPedidoService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/tipos-pedido")
@Tag(name = "Pedidos — Tipos de Pedido", description = "Cadastro de tipos de pedido (movimentação de estoque e financeiro)")
public class TipoPedidoController {

    private final TipoPedidoService tipoPedidoService;

    public TipoPedidoController(TipoPedidoService tipoPedidoService) {
        this.tipoPedidoService = tipoPedidoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    @Operation(summary = "Lista tipos de pedido com paginação e filtro por nome")
    public Page<TipoPedidoSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome
    ) {
        return tipoPedidoService.getAll(pageable, nome);
    }

    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    @Operation(summary = "Lista tipos de pedido ativos para uso em dropdowns")
    public ResponseEntity<List<TipoPedidoSummaryDto>> findAtivos() {
        return ResponseEntity.ok(tipoPedidoService.findAtivos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    @Operation(summary = "Busca tipo de pedido por ID")
    public ResponseEntity<TipoPedidoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(tipoPedidoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    @Operation(summary = "Cria novo tipo de pedido")
    public ResponseEntity<TipoPedidoResponseDto> create(
            @Valid @RequestBody TipoPedidoCreateDto dto
    ) {
        return new ResponseEntity<>(tipoPedidoService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    @Operation(summary = "Atualiza tipo de pedido")
    public ResponseEntity<TipoPedidoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody TipoPedidoCreateDto dto
    ) {
        return ResponseEntity.ok(tipoPedidoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    @Operation(summary = "Remove tipo de pedido")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tipoPedidoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
