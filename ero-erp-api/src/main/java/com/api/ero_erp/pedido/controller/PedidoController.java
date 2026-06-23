package com.api.ero_erp.pedido.controller;

import com.api.ero_erp.pedido.dtos.*;
import com.api.ero_erp.pedido.enums.StatusPedido;
import com.api.ero_erp.pedido.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/pedidos")
@Tag(name = "Pedidos — Venda PDV", description = "Pedidos de venda/compra de produtos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @Operation(summary = "Lista pedidos com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    public Page<PedidoResponseDto> getAll(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) StatusPedido status,
            @RequestParam(required = false) Long         emitenteId,
            @RequestParam(required = false) Long         pessoaId,
            @RequestParam(required = false) Long         tipoPedidoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim,
            @RequestParam(required = false) String       nomePessoa,
            @RequestParam(required = false) Boolean      faturado
    ) {
        return pedidoService.getAll(pageable, status, emitenteId, pessoaId, tipoPedidoId, inicio, fim, nomePessoa, faturado);
    }

    @Operation(summary = "Busca pedido por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    public ResponseEntity<PedidoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.findByIdResponse(id));
    }

    @Operation(summary = "Cria pedido")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> create(@Valid @RequestBody PedidoCreateDto dto) {
        return new ResponseEntity<>(pedidoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza info básica do pedido")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody PedidoUpdateDto dto
    ) {
        return ResponseEntity.ok(pedidoService.update(id, dto));
    }

    @Operation(summary = "Conclui o pedido e movimenta estoque conforme o tipo de pedido")
    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> concluir(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.concluir(id));
    }

    @Operation(summary = "Marca o pedido como faturado (conclui antes, se ainda aberto)")
    @PatchMapping("/{id}/faturar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> faturar(
            @PathVariable Long id,
            @RequestBody(required = false) FaturarPedidoDto dto
    ) {
        return ResponseEntity.ok(pedidoService.faturar(
                id,
                dto != null ? dto.contaId()          : null,
                dto != null ? dto.creditoUtilizado() : null));
    }

    @Operation(summary = "Cancela o pedido")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> cancelar(
            @PathVariable Long id,
            @RequestBody(required = false) CancelarPedidoDto dto
    ) {
        return ResponseEntity.ok(pedidoService.cancelar(id, dto != null ? dto.motivo() : null));
    }

    @Operation(summary = "Devolve produtos do pedido (total ou parcial) e gera crédito quando aplicável")
    @PatchMapping("/{id}/devolver")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoResponseDto> devolver(
            @PathVariable Long id,
            @RequestBody DevolverPedidoDto dto
    ) {
        return ResponseEntity.ok(pedidoService.devolver(id, dto));
    }

    // ── Produtos do pedido ──────────────────────────────────────────────────────

    @Operation(summary = "Adiciona produto ao pedido")
    @PostMapping("/{id}/produtos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoProdutoResponseDto> adicionarProduto(
            @PathVariable Long id,
            @Valid @RequestBody PedidoProdutoCreateDto dto
    ) {
        return new ResponseEntity<>(pedidoService.adicionarProduto(id, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza produto do pedido")
    @PutMapping("/{id}/produtos/{produtoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<PedidoProdutoResponseDto> atualizarProduto(
            @PathVariable Long id,
            @PathVariable Long produtoId,
            @Valid @RequestBody PedidoProdutoCreateDto dto
    ) {
        return ResponseEntity.ok(pedidoService.atualizarProduto(id, produtoId, dto));
    }

    @Operation(summary = "Remove produto do pedido")
    @DeleteMapping("/{id}/produtos/{produtoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO')")
    public ResponseEntity<Void> removerProduto(
            @PathVariable Long id,
            @PathVariable Long produtoId
    ) {
        pedidoService.removerProduto(id, produtoId);
        return ResponseEntity.noContent().build();
    }
}
