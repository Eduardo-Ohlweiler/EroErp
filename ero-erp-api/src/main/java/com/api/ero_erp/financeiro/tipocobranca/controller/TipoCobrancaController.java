package com.api.ero_erp.financeiro.tipocobranca.controller;

import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaCreateDto;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaResponseDto;
import com.api.ero_erp.financeiro.tipocobranca.dtos.TipoCobrancaUpdateDto;
import com.api.ero_erp.financeiro.tipocobranca.mapper.TipoCobrancaMapper;
import com.api.ero_erp.financeiro.tipocobranca.service.TipoCobrancaService;
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
@RequestMapping("/financeiro/tipos-cobranca")
@Tag(name = "Tipos de Cobrança", description = "Gerenciamento de tipos de cobrança")
public class TipoCobrancaController {

    private final TipoCobrancaService service;

    public TipoCobrancaController(TipoCobrancaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public Page<TipoCobrancaResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean ativo
    ) {
        return service.getAll(pageable, nome, ativo);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public List<TipoCobrancaResponseDto> select() {
        return service.select();
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public TipoCobrancaResponseDto findByIdForSelect(@PathVariable Long id) {
        return TipoCobrancaMapper.toDto(service.findById(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO', 'FINANCEIRO_GET')")
    public TipoCobrancaResponseDto findById(@PathVariable Long id) {
        return TipoCobrancaMapper.toDto(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<TipoCobrancaResponseDto> create(@Valid @RequestBody TipoCobrancaCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'FINANCEIRO')")
    public ResponseEntity<TipoCobrancaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody TipoCobrancaUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
