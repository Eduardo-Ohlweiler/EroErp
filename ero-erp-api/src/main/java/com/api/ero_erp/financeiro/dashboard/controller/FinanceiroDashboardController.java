package com.api.ero_erp.financeiro.dashboard.controller;

import com.api.ero_erp.financeiro.dashboard.dtos.FinanceiroDashboardDto;
import com.api.ero_erp.financeiro.dashboard.service.FinanceiroDashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/financeiro/dashboard")
@Tag(name = "Financeiro Dashboard", description = "Dashboard financeiro consolidado")
public class FinanceiroDashboardController {

    private final FinanceiroDashboardService service;

    public FinanceiroDashboardController(FinanceiroDashboardService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public FinanceiroDashboardDto getDashboard() {
        return service.getDashboard();
    }
}
