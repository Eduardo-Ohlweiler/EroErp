package com.api.ero_api.tenant.controller;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.tenant.dtos.TenantAtualDto;
import com.api.ero_api.tenant.dtos.TenantCreateDto;
import com.api.ero_api.tenant.dtos.TenantResponseDto;
import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.dtos.TenantUpdateDto;
import com.api.ero_api.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Contratantes", description = "Gestão de contratantes (superadmin)")
public class TenantController {

    private final TenantService service;

    public TenantController(TenantService service) {
        this.service = service;
    }

    @GetMapping("/atual")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Contratante em que estou atuando (nome e cor)")
    public TenantAtualDto atual() {
        return service.atual();
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Lista contratantes")
    public PaginaDto<TenantResponseDto> listar(@RequestParam(required = false) @Size(max = 100, message = "Busca muito longa") String busca,
                                               @RequestParam(required = false) Boolean ativo,
                                               @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(busca, ativo, pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Contratantes ativos para combos")
    public List<TenantSelectDto> selecao() {
        return service.buscarParaSelecao();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Busca um contratante")
    public TenantResponseDto buscar(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Cadastra contratante e o primeiro administrador")
    public ResponseEntity<TenantResponseDto> criar(@Valid @RequestBody TenantCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Altera um contratante")
    public TenantResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody TenantUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Inativa um contratante (ninguém dele consegue entrar)")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @Operation(summary = "Reativa um contratante")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
