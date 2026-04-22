package com.api.ero_erp.tipotelefone.controller;

import com.api.ero_erp.tipotelefone.dtos.TipoTelefoneCreateDto;
import com.api.ero_erp.tipotelefone.dtos.TipoTelefoneUpdateDto;
import com.api.ero_erp.tipotelefone.entity.TipoTelefone;
import com.api.ero_erp.tipotelefone.service.TipoTelefoneService;
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
@RequestMapping("/tipos/telefone")
@Tag(name = "Tipo Telefone", description = "Tipos de telefone")
public class TipoTelefoneController {

    private final TipoTelefoneService service;

    public TipoTelefoneController(TipoTelefoneService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<TipoTelefone> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, nome);
    }

    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<TipoTelefone> select() {
        return service.select();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public TipoTelefone findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoTelefone> create(@Valid @RequestBody TipoTelefoneCreateDto dto) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoTelefone> update(
            @PathVariable Long id,
            @Valid @RequestBody TipoTelefoneUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
