package com.api.ero_erp.pediatria.dashboard.controller;

import com.api.ero_erp.pediatria.dashboard.dto.PediatriaGeralDashboardDto;
import com.api.ero_erp.pediatria.dashboard.dto.PediatriaPacienteDashboardDto;
import com.api.ero_erp.pediatria.dashboard.service.PediatriaDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pediatria/dashboard")
@Tag(name = "Pediatria Dashboard", description = "Dashboards do módulo de Pediatria: visão por paciente e visão geral")
public class PediatriaDashboardController {

    private final PediatriaDashboardService dashboardService;

    public PediatriaDashboardController(PediatriaDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Dashboard de um paciente específico. dias=0 retorna todo o histórico.")
    @GetMapping("/paciente")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    public ResponseEntity<PediatriaPacienteDashboardDto> getPacienteDashboard(
            @RequestParam Long pessoaId,
            @RequestParam(defaultValue = "0") int dias,
            @RequestParam(required = false) Long formulaLacteaId,
            @RequestParam(required = false) Integer mesesMin,
            @RequestParam(required = false) Integer mesesMax
    ) {
        return ResponseEntity.ok(
                dashboardService.getPacienteDashboard(pessoaId, dias, formulaLacteaId, mesesMin, mesesMax));
    }

    @Operation(summary = "Dashboard geral (agregado) de Pediatria. dias=0 retorna tudo.")
    @GetMapping("/geral")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIATRIA', 'PEDIATRIA_GET')")
    public ResponseEntity<PediatriaGeralDashboardDto> getGeralDashboard(
            @RequestParam(defaultValue = "365") int dias,
            @RequestParam(required = false) Long formulaLacteaId,
            @RequestParam(required = false) Integer mesesMin,
            @RequestParam(required = false) Integer mesesMax,
            @RequestParam(required = false) String sexo
    ) {
        return ResponseEntity.ok(
                dashboardService.getGeralDashboard(dias, formulaLacteaId, mesesMin, mesesMax, sexo));
    }
}
