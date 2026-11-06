package com.api.ero_api.usuario.controller;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.usuario.dtos.UsuarioCreateDto;
import com.api.ero_api.usuario.dtos.UsuarioRedefinirSenhaDto;
import com.api.ero_api.usuario.dtos.UsuarioResponseDto;
import com.api.ero_api.usuario.dtos.UsuarioSelectDto;
import com.api.ero_api.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_api.usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

/**
 * MÓDULO-MODELO. Todo controller novo segue este formato:
 * rota plural em /api, só DTO entra e sai, {@code @PreAuthorize} em TODOS os
 * métodos (LER nos GET, ESCREVER no resto), nenhuma regra de negócio aqui.
 */
@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuários", description = "Usuários do contratante")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USUARIOS_LER')")
    @Operation(summary = "Lista usuários com filtro e paginação")
    public PaginaDto<UsuarioResponseDto> listar(
            @Parameter(description = "Parte do nome ou do e-mail") @RequestParam(required = false) @Size(max = 100, message = "Busca muito longa") String busca,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(busca, ativo, pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Usuários ativos para combos (id e nome)")
    public List<UsuarioSelectDto> selecao() {
        return service.buscarParaSelecao();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIOS_LER')")
    @Operation(summary = "Busca um usuário")
    public UsuarioResponseDto buscar(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Cadastra um usuário (senha temporária)")
    public ResponseEntity<UsuarioResponseDto> criar(@Valid @RequestBody UsuarioCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Altera um usuário")
    public UsuarioResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody UsuarioUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Inativa um usuário e encerra as sessões dele")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Reativa um usuário")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/desbloquear")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Libera conta bloqueada por excesso de tentativas (só administradores)")
    public ResponseEntity<Void> desbloquear(@PathVariable UUID id) {
        service.desbloquear(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/redefinir-senha")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Define uma senha temporária para o usuário (só administradores)")
    public ResponseEntity<Void> redefinirSenha(@PathVariable UUID id, @Valid @RequestBody UsuarioRedefinirSenhaDto dto) {
        service.redefinirSenha(id, dto);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/redefinir-2fa")
    @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
    @Operation(summary = "Desliga a verificação em duas etapas do usuário (só administradores)")
    public ResponseEntity<Void> redefinirDoisFatores(@PathVariable UUID id) {
        service.redefinirDoisFatores(id);
        return ResponseEntity.noContent().build();
    }
}
