package com.api.ero_erp.otorrino.dashboard.controller;

import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoGeralDashboardDto;
import com.api.ero_erp.otorrino.dashboard.dto.OtorrinoPacienteDashboardDto;
import com.api.ero_erp.otorrino.dashboard.service.OtorrinoDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/otorrino/dashboard")
@Tag(name = "Otorrino Dashboard", description = "Dashboards do módulo de Otorrinolaringologia: visão por paciente e visão geral")
public class OtorrinoDashboardController {

    private final OtorrinoDashboardService dashboardService;

    public OtorrinoDashboardController(OtorrinoDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Dashboard de um paciente específico. dias=0 retorna todo o histórico.")
    @GetMapping("/paciente")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    public ResponseEntity<OtorrinoPacienteDashboardDto> getPacienteDashboard(
            @RequestParam Long pessoaId,
            @RequestParam(defaultValue = "0") int dias
    ) {
        return ResponseEntity.ok(dashboardService.getPacienteDashboard(pessoaId, dias));
    }

    @Operation(summary = "Dashboard geral (agregado) de Otorrino. dias=0 retorna tudo.")
    @GetMapping("/geral")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    public ResponseEntity<OtorrinoGeralDashboardDto> getGeralDashboard(
            @RequestParam(defaultValue = "365") int dias
    ) {
        return ResponseEntity.ok(dashboardService.getGeralDashboard(dias));
    }
}
