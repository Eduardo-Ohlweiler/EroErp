package com.api.ero_erp.financeiro.formapagamento.controller;

import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoCreateDto;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoResponseDto;
import com.api.ero_erp.financeiro.formapagamento.dtos.FormaPagamentoUpdateDto;
import com.api.ero_erp.financeiro.formapagamento.mapper.FormaPagamentoMapper;
import com.api.ero_erp.financeiro.formapagamento.service.FormaPagamentoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/financeiro/formas-pagamento")
@Tag(name = "Formas de Pagamento", description = "Gerenciamento de formas de pagamento")
public class FormaPagamentoController {

    private final FormaPagamentoService service;

    public FormaPagamentoController(FormaPagamentoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public Page<FormaPagamentoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<FormaPagamentoResponseDto> select() {
        return service.select();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public FormaPagamentoResponseDto findByIdForSelect(@PathVariable Long id) {
        return FormaPagamentoMapper.toDto(service.findById(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public FormaPagamentoResponseDto findById(@PathVariable Long id) {
        return FormaPagamentoMapper.toDto(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<FormaPagamentoResponseDto> create(@Valid @RequestBody FormaPagamentoCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<FormaPagamentoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody FormaPagamentoUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
