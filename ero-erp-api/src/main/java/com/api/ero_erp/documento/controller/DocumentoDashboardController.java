package com.api.ero_erp.documento.controller;

import com.api.ero_erp.documento.dtos.DocumentoDashboardDto;
import com.api.ero_erp.documento.entity.DocumentoStatus;
import com.api.ero_erp.documento.service.DocumentoDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documentos/dashboard")
@Tag(name = "Documentos Dashboard", description = "Dados analíticos de documentos (contratos)")
public class DocumentoDashboardController {

    private final DocumentoDashboardService dashboardService;

    public DocumentoDashboardController(DocumentoDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Retorna dados do dashboard de documentos. dias=0 retorna tudo.")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'DOCUMENTO', 'DOCUMENTO_GET')")
    public ResponseEntity<DocumentoDashboardDto> getDashboard(
            @RequestParam(defaultValue = "365")          int             dias,
            @RequestParam(required = false)              Long            emitenteId,
            @RequestParam(required = false)              DocumentoStatus status,
            @RequestParam(required = false)              Long            cidadeId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(dias, emitenteId, status, cidadeId));
    }
}
