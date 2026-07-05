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
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<ConfiguracaoCrmResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<ConfiguracaoCrmResponseDto> salvar(@RequestBody ConfiguracaoCrmUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/qrcode")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<CrmQrCodeResponseDto> gerarQrCode() {
        return ResponseEntity.ok(service.gerarQrCode());
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CRM')")
    public ResponseEntity<CrmStatusResponseDto> consultarStatus() {
        return ResponseEntity.ok(service.consultarStatus());
    }
}
