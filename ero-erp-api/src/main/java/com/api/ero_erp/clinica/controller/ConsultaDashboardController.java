package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dtos.ConsultaDashboardDto;
import com.api.ero_erp.clinica.service.ConsultaDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/consultas/dashboard")
@Tag(name = "Consultas Dashboard", description = "Dados analíticos de consultas")
public class ConsultaDashboardController {

    private final ConsultaDashboardService dashboardService;

    public ConsultaDashboardController(ConsultaDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Retorna dados do dashboard de consultas. dias=0 retorna tudo.")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public ResponseEntity<ConsultaDashboardDto> getDashboard(
            @RequestParam(defaultValue = "365") int dias
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(dias));
    }
}
