package com.api.ero_erp.assinatura.controller;

import com.api.ero_erp.assinatura.dtos.AssinaturaDocumentoResponseDto;
import com.api.ero_erp.assinatura.dtos.SolicitarAssinaturaResponseDto;
import com.api.ero_erp.assinatura.service.AssinaturaDocumentoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documentos")
public class AssinaturaDocumentoController {

    private final AssinaturaDocumentoService service;

    public AssinaturaDocumentoController(AssinaturaDocumentoService service) {
        this.service = service;
    }

    @PostMapping("/{id}/solicitar-assinatura")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SolicitarAssinaturaResponseDto> solicitar(@PathVariable Long id) {
        return ResponseEntity.ok(service.solicitarAssinatura(id));
    }

    @GetMapping("/{id}/assinatura")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssinaturaDocumentoResponseDto> getAssinatura(@PathVariable Long id) {
        AssinaturaDocumentoResponseDto dto = service.getAssinatura(id);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{id}/assinatura/aceitar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssinaturaDocumentoResponseDto> aceitar(@PathVariable Long id) {
        return ResponseEntity.ok(service.aceitar(id));
    }

    @PatchMapping("/{id}/assinatura/rejeitar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssinaturaDocumentoResponseDto> rejeitar(@PathVariable Long id) {
        return ResponseEntity.ok(service.rejeitar(id));
    }
}
