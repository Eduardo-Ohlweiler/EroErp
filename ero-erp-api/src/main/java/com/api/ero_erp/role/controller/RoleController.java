package com.api.ero_erp.role.controller;

import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/roles")
@Tag(name = "Role", description = "Operação relacionadas a roles")
public class RoleController {

    private RoleService roleService;
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @Operation(summary = "Busca um role por id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role encontrado"),
            @ApiResponse(responseCode = "404", description = "Role não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN')")
    public Role findById(@PathVariable Long id){
        return this.roleService.findById(id);
    }

    @Operation(
            summary = "Lista todos os roles",
            description = "Exemplo: /roles?page=0&size=10"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN','ADMIN')")
    public Page<Role> getAll(
            @PageableDefault(size = 15, sort = "nome")
            Pageable pageable
    ) {
        return roleService.getAll(pageable);
    }
}
