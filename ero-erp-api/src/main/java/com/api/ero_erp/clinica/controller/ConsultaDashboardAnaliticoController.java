package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dtos.ConsultaDashboardAnaliticoDto;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.clinica.service.ConsultaDashboardAnaliticoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/consultas/dashboard/analitico")
@Tag(name = "Consultas Dashboard Analítico", description = "Visão analítica de consultas com filtros, faturamento e KPIs de reconsulta")
public class ConsultaDashboardAnaliticoController {

    private final ConsultaDashboardAnaliticoService dashboardService;

    public ConsultaDashboardAnaliticoController(ConsultaDashboardAnaliticoService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Retorna a visão analítica do dashboard de consultas. dias=0 retorna tudo.")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public ResponseEntity<ConsultaDashboardAnaliticoDto> getDashboard(
            @RequestParam(defaultValue = "365") int dias,
            @RequestParam(required = false) Long emitenteId,
            @RequestParam(required = false) StatusConsulta status,
            @RequestParam(required = false) Long pessoaId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(dias, emitenteId, status, pessoaId));
    }
}
