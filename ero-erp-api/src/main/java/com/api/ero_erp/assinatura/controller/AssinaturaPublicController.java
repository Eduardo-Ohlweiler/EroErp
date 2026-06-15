package com.api.ero_erp.assinatura.controller;

import com.api.ero_erp.assinatura.dtos.AssinaturaPublicResponseDto;
import com.api.ero_erp.assinatura.dtos.SubmeterAssinaturaDto;
import com.api.ero_erp.assinatura.service.AssinaturaDocumentoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/assinatura")
public class AssinaturaPublicController {

    private final AssinaturaDocumentoService service;

    public AssinaturaPublicController(AssinaturaDocumentoService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    public ResponseEntity<AssinaturaPublicResponseDto> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(service.getByToken(token));
    }

    @PostMapping("/{token}")
    public ResponseEntity<Void> submeter(
            @PathVariable String token,
            @RequestBody SubmeterAssinaturaDto dto,
            HttpServletRequest request
    ) {
        String ip = request.getRemoteAddr();
        service.submeterAssinatura(token, dto.dadosAssinatura(), ip);
        return ResponseEntity.ok().build();
    }
}
