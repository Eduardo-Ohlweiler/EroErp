package com.api.ero_erp.crm.fluxokanban.controller;

import com.api.ero_erp.crm.fluxokanban.dtos.FluxoKanbanColunaItemDto;
import com.api.ero_erp.crm.fluxokanban.dtos.FluxoKanbanColunaResponseDto;
import com.api.ero_erp.crm.fluxokanban.service.FluxoKanbanService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/crm/fluxo-kanban")
public class FluxoKanbanController {

    private final FluxoKanbanService service;

    public FluxoKanbanController(FluxoKanbanService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FluxoKanbanColunaResponseDto>> getFluxo() {
        return ResponseEntity.ok(service.getFluxo());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FluxoKanbanColunaResponseDto>> salvar(
            @RequestBody List<FluxoKanbanColunaItemDto> itens
    ) {
        return ResponseEntity.ok(service.salvar(itens));
    }
}
