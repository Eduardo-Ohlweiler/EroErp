package com.api.ero_erp.terapianutricional.dashboard.controller;

import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalAcompanhamentoDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalGeralDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.dto.TerapiaNutricionalPacienteDashboardDto;
import com.api.ero_erp.terapianutricional.dashboard.service.TerapiaNutricionalDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/terapia-nutricional/dashboard")
@Tag(name = "Terapia Nutricional Dashboard", description = "Dashboards do módulo de Terapia Nutricional: visão por paciente")
public class TerapiaNutricionalDashboardController {

    private final TerapiaNutricionalDashboardService dashboardService;

    public TerapiaNutricionalDashboardController(TerapiaNutricionalDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Dashboard de um paciente específico. dias=0 retorna todo o histórico.")
    @GetMapping("/paciente")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    public ResponseEntity<TerapiaNutricionalPacienteDashboardDto> getPacienteDashboard(
            @RequestParam Long pessoaId,
            @RequestParam(defaultValue = "0") int dias
    ) {
        return ResponseEntity.ok(dashboardService.getPacienteDashboard(pessoaId, dias));
    }

    @Operation(summary = "Painel de acompanhamento diário de um paciente. dias=0 retorna todo o histórico.")
    @GetMapping("/acompanhamento")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    public ResponseEntity<TerapiaNutricionalAcompanhamentoDashboardDto> getAcompanhamentoDashboard(
            @RequestParam Long pessoaId,
            @RequestParam(defaultValue = "0") int dias
    ) {
        return ResponseEntity.ok(dashboardService.getAcompanhamentoDashboard(pessoaId, dias));
    }

    @Operation(summary = "Dashboard geral (agregado) de Terapia Nutricional. Sem datas, usa os últimos 365 dias.")
    @GetMapping("/geral")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TERAPIA_NUTRICIONAL', 'TERAPIA_NUTRICIONAL_GET')")
    public ResponseEntity<TerapiaNutricionalGeralDashboardDto> getGeralDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return ResponseEntity.ok(dashboardService.getGeralDashboard(dataInicio, dataFim));
    }
}
