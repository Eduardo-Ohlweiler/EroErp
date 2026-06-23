package com.api.ero_erp.credito.controller;

import com.api.ero_erp.credito.dtos.CreditoClienteResponseDto;
import com.api.ero_erp.credito.dtos.CreditoSaldoDto;
import com.api.ero_erp.credito.service.CreditoClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/creditos")
@Tag(name = "Créditos de Clientes", description = "Saldo e histórico de crédito (haver) por cliente")
public class CreditoClienteController {

    private final CreditoClienteService service;

    public CreditoClienteController(CreditoClienteService service) {
        this.service = service;
    }

    @Operation(summary = "Saldo de crédito disponível da pessoa")
    @GetMapping("/saldo")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    public ResponseEntity<CreditoSaldoDto> saldo(@RequestParam Long pessoaId) {
        return ResponseEntity.ok(new CreditoSaldoDto(pessoaId, service.saldo(pessoaId)));
    }

    @Operation(summary = "Histórico de movimentos de crédito da pessoa")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PEDIDO', 'PEDIDO_GET')")
    public Page<CreditoClienteResponseDto> getHistorico(
            @RequestParam Long pessoaId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return service.getHistorico(pessoaId, pageable);
    }
}
