package com.api.ero_erp.financeiro.contapagar.controller;

import com.api.ero_erp.financeiro.contapagar.dtos.*;
import com.api.ero_erp.financeiro.contapagar.mapper.ContaPagarMapper;
import com.api.ero_erp.financeiro.contapagar.service.ContaPagarService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/financeiro/contas-pagar")
@Tag(name = "Contas a Pagar", description = "Gerenciamento de contas a pagar")
public class ContaPagarController {

    private final ContaPagarService service;

    public ContaPagarController(ContaPagarService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public Page<ContaPagarResponseDto> getAll(
            @PageableDefault(size = 15, sort = "data") Pageable pageable,
            @RequestParam(required = false) Long emitenteId,
            @RequestParam(required = false) Long pessoaId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, emitenteId, pessoaId, status, dataInicio, dataFim, ativo);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public ContaPagarResponseDto findById(@PathVariable Long id) {
        return ContaPagarMapper.toDto(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaPagarResponseDto> create(@Valid @RequestBody ContaPagarCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaPagarResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ContaPagarUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/parcelas/{parcelaId}/pagar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaPagarResponseDto> pagarParcela(
            @PathVariable Long parcelaId,
            @Valid @RequestBody ParcelaContaPagarPagarDto dto
    ) {
        return ResponseEntity.ok(service.pagarParcela(parcelaId, dto));
    }
}
