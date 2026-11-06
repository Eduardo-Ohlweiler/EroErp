package com.api.ero_api.permissao.controller;

import com.api.ero_api.permissao.dtos.CatalogoGrupoDto;
import com.api.ero_api.permissao.dtos.LiberacoesResponseDto;
import com.api.ero_api.permissao.dtos.LiberacoesUpdateDto;
import com.api.ero_api.permissao.service.PermissaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/permissoes")
@Tag(name = "Permissões", description = "Grupos de liberação por usuário")
public class PermissaoController {

    private final PermissaoService service;

    public PermissaoController(PermissaoService service) {
        this.service = service;
    }

    @GetMapping("/catalogo")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Catálogo de grupos, telas e ações que podem ser liberados")
    public List<CatalogoGrupoDto> catalogo() {
        return service.catalogo();
    }

    @GetMapping("/usuarios/{usuarioId}")
    @PreAuthorize("hasAuthority('USUARIOS_LER')")
    @Operation(summary = "Liberações de um usuário")
    public LiberacoesResponseDto buscar(@PathVariable UUID usuarioId) {
        return service.buscarDoUsuario(usuarioId);
    }

    @PutMapping("/usuarios/{usuarioId}")
    @PreAuthorize("hasAuthority('USUARIOS_LIBERAR_ACESSO')")
    @Operation(summary = "Substitui todas as liberações de um usuário")
    public LiberacoesResponseDto substituir(@PathVariable UUID usuarioId, @Valid @RequestBody LiberacoesUpdateDto dto) {
        return service.substituir(usuarioId, dto);
    }
}
