package com.api.ero_erp.configuracaoconsulta.controller;

import com.api.ero_erp.configuracaoconsulta.dtos.ConfiguracaoConsultaResponseDto;
import com.api.ero_erp.configuracaoconsulta.dtos.ConfiguracaoConsultaUpsertDto;
import com.api.ero_erp.configuracaoconsulta.service.ConfiguracaoConsultaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/consultas/configuracao")
public class ConfiguracaoConsultaController {

    private final ConfiguracaoConsultaService service;

    public ConfiguracaoConsultaController(ConfiguracaoConsultaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoConsultaResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoConsultaResponseDto> salvar(@RequestBody ConfiguracaoConsultaUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }
}
