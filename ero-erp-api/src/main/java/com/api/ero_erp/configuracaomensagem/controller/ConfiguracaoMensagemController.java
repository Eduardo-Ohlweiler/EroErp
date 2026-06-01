package com.api.ero_erp.configuracaomensagem.controller;

import com.api.ero_erp.configuracaomensagem.dtos.ConfiguracaoMensagemResponseDto;
import com.api.ero_erp.configuracaomensagem.dtos.ConfiguracaoMensagemUpsertDto;
import com.api.ero_erp.configuracaomensagem.service.ConfiguracaoMensagemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/whatsapp/configuracao-mensagem")
public class ConfiguracaoMensagemController {

    private final ConfiguracaoMensagemService service;

    public ConfiguracaoMensagemController(ConfiguracaoMensagemService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoMensagemResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoMensagemResponseDto> salvar(@RequestBody ConfiguracaoMensagemUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }
}
