package com.api.ero_erp.pedido.controller;

import com.api.ero_erp.pedido.dtos.PedidoDashboardDto;
import com.api.ero_erp.pedido.enums.StatusPedido;
import com.api.ero_erp.pedido.service.PedidoDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/pedidos/dashboard")
@Tag(name = "Pedidos — Dashboard", description = "Indicadores de pedidos (geral e por pessoa)")
public class PedidoDashboardController {

    private final PedidoDashboardService dashboardService;

    public PedidoDashboardController(PedidoDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Indicadores de pedidos com filtros opcionais (período, emitente, tipo de pedido, status, pessoa)")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    public ResponseEntity<PedidoDashboardDto> getDashboard(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim,
            @RequestParam(required = false) Long emitenteId,
            @RequestParam(required = false) Long tipoPedidoId,
            @RequestParam(required = false) StatusPedido status,
            @RequestParam(required = false) Long pessoaId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(inicio, fim, emitenteId, tipoPedidoId, status, pessoaId));
    }
}
