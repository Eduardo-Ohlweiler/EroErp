package com.api.ero_erp.configuracaodocumento.controller;

import com.api.ero_erp.configuracaodocumento.dtos.ConfiguracaoDocumentoResponseDto;
import com.api.ero_erp.configuracaodocumento.dtos.ConfiguracaoDocumentoUpsertDto;
import com.api.ero_erp.configuracaodocumento.service.ConfiguracaoDocumentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documentos/configuracao")
public class ConfiguracaoDocumentoController {

    private final ConfiguracaoDocumentoService service;

    public ConfiguracaoDocumentoController(ConfiguracaoDocumentoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoDocumentoResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoDocumentoResponseDto> salvar(@RequestBody ConfiguracaoDocumentoUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }
}
