package com.api.ero_erp.configuracaopendencias.controller;

import com.api.ero_erp.configuracaopendencias.dtos.ConfiguracaoPendenciasResponseDto;
import com.api.ero_erp.configuracaopendencias.dtos.ConfiguracaoPendenciasUpsertDto;
import com.api.ero_erp.configuracaopendencias.service.ConfiguracaoPendenciasService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboards/configuracao-pendencias")
public class ConfiguracaoPendenciasController {

    private final ConfiguracaoPendenciasService service;

    public ConfiguracaoPendenciasController(ConfiguracaoPendenciasService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoPendenciasResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoPendenciasResponseDto> salvar(@RequestBody ConfiguracaoPendenciasUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }
}
