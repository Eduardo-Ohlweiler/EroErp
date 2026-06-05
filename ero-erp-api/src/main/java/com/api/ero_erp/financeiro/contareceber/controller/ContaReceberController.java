package com.api.ero_erp.financeiro.contareceber.controller;

import com.api.ero_erp.financeiro.contareceber.dtos.*;
import com.api.ero_erp.financeiro.contareceber.mapper.ContaReceberMapper;
import com.api.ero_erp.financeiro.contareceber.service.ContaReceberService;
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
@RequestMapping("/financeiro/contas-receber")
@Tag(name = "Contas a Receber", description = "Gerenciamento de contas a receber")
public class ContaReceberController {

    private final ContaReceberService service;

    public ContaReceberController(ContaReceberService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public Page<ContaReceberResponseDto> getAll(
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
    public ContaReceberResponseDto findById(@PathVariable Long id) {
        return ContaReceberMapper.toDto(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaReceberResponseDto> create(@Valid @RequestBody ContaReceberCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaReceberResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ContaReceberUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/parcelas/{parcelaId}/pagar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<ContaReceberResponseDto> pagarParcela(
            @PathVariable Long parcelaId,
            @Valid @RequestBody ParcelaContaReceberPagarDto dto
    ) {
        return ResponseEntity.ok(service.pagarParcela(parcelaId, dto));
    }
}
