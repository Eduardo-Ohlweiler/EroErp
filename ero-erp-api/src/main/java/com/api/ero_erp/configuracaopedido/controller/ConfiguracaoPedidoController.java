package com.api.ero_erp.configuracaopedido.controller;

import com.api.ero_erp.configuracaopedido.dtos.ConfiguracaoPedidoResponseDto;
import com.api.ero_erp.configuracaopedido.dtos.ConfiguracaoPedidoUpsertDto;
import com.api.ero_erp.configuracaopedido.service.ConfiguracaoPedidoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pedidos/configuracao")
public class ConfiguracaoPedidoController {

    private final ConfiguracaoPedidoService service;

    public ConfiguracaoPedidoController(ConfiguracaoPedidoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoPedidoResponseDto> get() {
        return ResponseEntity.ok(service.getAtual());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConfiguracaoPedidoResponseDto> salvar(@RequestBody ConfiguracaoPedidoUpsertDto dto) {
        return ResponseEntity.ok(service.salvar(dto));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletar() {
        service.deletar();
        return ResponseEntity.noContent().build();
    }
}
