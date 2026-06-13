package com.api.ero_erp.dashboard.controller;

import com.api.ero_erp.dashboard.dtos.PendenciasFinanceirasDto;
import com.api.ero_erp.dashboard.service.DashboardGeralService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboards")
@Tag(name = "Dashboard Geral", description = "Indicadores e pendências gerais do sistema")
public class DashboardGeralController {

    private final DashboardGeralService dashboardGeralService;

    public DashboardGeralController(DashboardGeralService dashboardGeralService) {
        this.dashboardGeralService = dashboardGeralService;
    }

    @GetMapping("/pendencias-financeiras")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Retorna parcelas em aberto vencidas ou que vencem nos próximos N dias configurados")
    public ResponseEntity<PendenciasFinanceirasDto> getPendenciasFinanceiras() {
        return ResponseEntity.ok(dashboardGeralService.getPendenciasFinanceiras());
    }
}
