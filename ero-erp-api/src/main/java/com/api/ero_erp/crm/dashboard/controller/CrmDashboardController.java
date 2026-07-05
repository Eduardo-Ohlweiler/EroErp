package com.api.ero_erp.crm.dashboard.controller;

import com.api.ero_erp.crm.dashboard.dtos.CrmDashboardDto;
import com.api.ero_erp.crm.dashboard.service.CrmDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/crm/dashboard")
public class CrmDashboardController {

    private final CrmDashboardService service;

    public CrmDashboardController(CrmDashboardService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<CrmDashboardDto> getDashboard(
            @RequestParam(defaultValue = "30") int    dias,
            @RequestParam(required = false)    Long   usuarioId,
            @RequestParam(required = false)    Long   andamentoId,
            @RequestParam(required = false)    String uf
    ) {
        return ResponseEntity.ok(service.getDashboard(dias, usuarioId, andamentoId, uf));
    }
}
