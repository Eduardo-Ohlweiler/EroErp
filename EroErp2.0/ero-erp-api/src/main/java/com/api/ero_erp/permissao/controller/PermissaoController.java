package com.api.ero_erp.permissao.controller;

import com.api.ero_erp.permissao.dtos.CatalogoModuloDto;
import com.api.ero_erp.permissao.service.PermissaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * O catálogo de módulos e telas que se libera por usuário. Quem libera é o
 * superadmin, no cadastro de usuários — daí a mesma restrição.
 */
@RestController
@RequestMapping("/permissoes")
@RequiredArgsConstructor
@Tag(name = "Permissões")
@PreAuthorize("hasRole('SUPERADMIN')")
public class PermissaoController {

    private final PermissaoService permissaoService;

    @GetMapping("/catalogo")
    @Operation(summary = "Módulos e telas que se pode liberar a um usuário")
    public ResponseEntity<List<CatalogoModuloDto>> catalogo() {
        return ResponseEntity.ok(permissaoService.catalogo());
    }
}
