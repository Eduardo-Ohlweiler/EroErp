package com.api.ero_erp.role.controller;

import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.role.dtos.RoleCreateDto;
import com.api.ero_erp.role.dtos.RoleUpdateDto;
import com.api.ero_erp.role.entity.Role;
import com.api.ero_erp.role.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/roles")
@Tag(name = "Role", description = "Operação relacionadas a roles")
public class RoleController {

    private final RoleService roleService;
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @Operation(summary = "Busca um role por id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role encontrado"),
            @ApiResponse(responseCode = "404", description = "Role não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
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
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<Role> getAll(
            @PageableDefault(size = 50, sort = "nome")
            Pageable pageable
    ) {
        return roleService.getAll(pageable);
    }

    @Operation(
            summary = "Lista todos os roles sem paginação",
            description = "Exemplo: /roles/select"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<Role> select() {
        return roleService.select();
    }

    @Operation(summary = "Deleta um role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Role deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Role não encontrado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws NotFoundException {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Cria um novo role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Role criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Role não encontrada"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Role> create(@Valid @RequestBody RoleCreateDto dto) {
        Role role = roleService.create(dto);
        return new ResponseEntity<>(role, HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente um role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Role atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Role não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Role> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody RoleUpdateDto dto
    ) {
        Role role = roleService.update(id, dto);
        return ResponseEntity.ok(role);
    }
}
