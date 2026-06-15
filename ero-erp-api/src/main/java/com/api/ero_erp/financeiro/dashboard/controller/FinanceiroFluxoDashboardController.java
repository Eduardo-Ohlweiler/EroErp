package com.api.ero_erp.financeiro.dashboard.controller;

import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroFluxoDashboardDto;
import com.api.ero_erp.financeiro.dashboard.service.FinanceiroFluxoDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/financeiro/dashboard/fluxo")
@Tag(name = "Financeiro Dashboard Fluxo", description = "Fluxo de caixa - creditos x debitos, com regime CAIXA/COMPETENCIA")
public class FinanceiroFluxoDashboardController {

    private final FinanceiroFluxoDashboardService service;

    public FinanceiroFluxoDashboardController(FinanceiroFluxoDashboardService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    @Operation(summary = "Fluxo de caixa (creditos x debitos) com alternador de regime e filtros de periodo/emitente/conta")
    public ResponseEntity<FinanceiroFluxoDashboardDto> getFluxo(
            @RequestParam(defaultValue = "365") int dias,
            @RequestParam(required = false) Long emitenteId,
            @RequestParam(required = false) Long contaId,
            @RequestParam(defaultValue = "CAIXA") String regime
    ) {
        return ResponseEntity.ok(service.getFluxo(dias, emitenteId, contaId, regime));
    }
}
