package com.api.ero_erp.tenant.controller;

import com.api.ero_erp.tenant.dtos.TenantAcessoDto;
import com.api.ero_erp.tenant.dtos.TenantCreateDto;
import com.api.ero_erp.tenant.dtos.TenantPaletaDto;
import com.api.ero_erp.tenant.dtos.TenantResponseDto;
import com.api.ero_erp.tenant.dtos.TenantSelectDto;
import com.api.ero_erp.tenant.dtos.TenantUpdateDto;
import com.api.ero_erp.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "Administração do sistema — somente SUPERADMIN")
@PreAuthorize("hasRole('SUPERADMIN')")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    @Operation(summary = "Lista os tenants",
            description = """
                    `expirandoEmDias` restringe a quem vence dentro da janela
                    — é o filtro "Expirando" da tela.""")
    public ResponseEntity<Page<TenantResponseDto>> getAll(
            @PageableDefault(size = 20, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Integer expirandoEmDias) {
        return ResponseEntity.ok(tenantService.getAll(pageable, nome, ativo, expirandoEmDias));
    }

    @GetMapping("/select")
    @Operation(summary = "Tenants ativos para o seletor")
    public ResponseEntity<List<TenantSelectDto>> select(@RequestParam(required = false) String nome) {
        return ResponseEntity.ok(tenantService.select(nome));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha um tenant")
    public ResponseEntity<TenantResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.findByIdResponse(id));
    }

    @PostMapping
    @Operation(summary = "Cria um tenant",
            description = """
                    Abre o cliente sem usuário; os usuários dele vêm depois, em
                    `POST /usuarios` com o `tenantId`. Período e paleta são
                    opcionais: sem eles, acesso indeterminado e paleta padrão.""")
    public ResponseEntity<TenantResponseDto> create(@Valid @RequestBody TenantCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.criar(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Altera o nome do tenant")
    public ResponseEntity<TenantResponseDto> update(@PathVariable UUID id,
                                                    @Valid @RequestBody TenantUpdateDto dto) {
        return ResponseEntity.ok(tenantService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @Operation(summary = "Ativa ou desativa o tenant",
            description = """
                    Tenant inativo bloqueia o login e invalida os tokens em uso.
                    Reativar um cliente com o período de acesso vencido devolve
                    409: use `PATCH /tenants/{id}/acesso`, que renova e reativa.""")
    public ResponseEntity<TenantResponseDto> alterarAtivo(@PathVariable UUID id,
                                                          @RequestParam boolean ativo) {
        return ResponseEntity.ok(tenantService.alterarAtivo(id, ativo));
    }

    @PatchMapping("/{id}/acesso")
    @Operation(summary = "Define ou renova o período de acesso",
            description = """
                    A data de expiração é sempre recontada a partir de hoje.
                    Reativa o cliente junto quando ele estava desligado por
                    prazo vencido.""")
    public ResponseEntity<TenantResponseDto> definirAcesso(@PathVariable UUID id,
                                                           @Valid @RequestBody TenantAcessoDto dto) {
        return ResponseEntity.ok(tenantService.definirAcesso(id, dto.periodoAcesso()));
    }

    @PatchMapping("/{id}/paleta")
    @Operation(summary = "Define a paleta de cores do tenant",
            description = """
                    Vale para todos os usuários do tenant, a partir da próxima
                    sessão. A tela de login abre sempre na paleta padrão.""")
    public ResponseEntity<TenantResponseDto> definirPaleta(@PathVariable UUID id,
                                                           @Valid @RequestBody TenantPaletaDto dto) {
        return ResponseEntity.ok(tenantService.definirPaleta(id, dto.paleta()));
    }
}
