package com.api.ero_erp.crm.configuracaocrm.controller;

import com.api.ero_erp.crm.configuracaocrm.dtos.ConfiguracaoCrmResponseDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.ConfiguracaoCrmUpsertDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.CrmQrCodeResponseDto;
import com.api.ero_erp.crm.configuracaocrm.dtos.CrmStatusResponseDto;
import com.api.ero_erp.crm.configuracaocrm.service.ConfiguracaoCrmService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/crm/configuracao")
public class ConfiguracaoCrmController {

    private final ConfiguracaoCrmService service;

    public ConfiguracaoCrmController(ConfiguracaoCrmService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoCrmResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoCrmResponseDto> salvar(@RequestBody ConfiguracaoCrmUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/qrcode")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CrmQrCodeResponseDto> gerarQrCode() {
        return ResponseEntity.ok(service.gerarQrCode());
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CrmStatusResponseDto> consultarStatus() {
        return ResponseEntity.ok(service.consultarStatus());
    }
}
