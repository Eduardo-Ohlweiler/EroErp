package com.api.ero_erp.grupoacesso.controller;

import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoCreateDto;
import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoResponseDto;
import com.api.ero_erp.grupoacesso.dtos.GrupoAcessoUpdateDto;
import com.api.ero_erp.grupoacesso.service.GrupoAcessoService;
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
@RequestMapping("/grupos-acesso")
@Tag(name = "Grupo de Acesso", description = "Operações relacionadas a grupos de acesso")
public class GrupoAcessoController {

    private final GrupoAcessoService grupoAcessoService;

    public GrupoAcessoController(GrupoAcessoService grupoAcessoService) {
        this.grupoAcessoService = grupoAcessoService;
    }

    @Operation(summary = "Busca um grupo de acesso por id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grupo de acesso encontrado"),
            @ApiResponse(responseCode = "404", description = "Grupo de acesso não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public GrupoAcessoResponseDto findById(@PathVariable Long id) {
        return grupoAcessoService.findByIdResponse(id);
    }

    @Operation(
            summary = "Lista todos os grupos de acesso",
            description = "Exemplo: /grupos-acesso?page=0&size=10&nome=financeiro"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<GrupoAcessoResponseDto> getAll(
            @PageableDefault(size = 50, sort = "nome")
            Pageable pageable,
            @RequestParam(required = false) String nome
    ) {
        return grupoAcessoService.getAll(pageable, nome);
    }

    @Operation(
            summary = "Lista todos os grupos de acesso sem paginação",
            description = "Exemplo: /grupos-acesso/select"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<GrupoAcessoResponseDto> select() {
        return grupoAcessoService.select();
    }

    @Operation(summary = "Deleta um grupo de acesso")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Grupo de acesso deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Grupo de acesso não encontrado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        grupoAcessoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Cria um novo grupo de acesso")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Grupo de acesso criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Role não encontrada"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<GrupoAcessoResponseDto> create(@Valid @RequestBody GrupoAcessoCreateDto dto) {
        GrupoAcessoResponseDto grupo = grupoAcessoService.create(dto);
        return new ResponseEntity<>(grupo, HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente um grupo de acesso")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Grupo de acesso atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Grupo de acesso não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<GrupoAcessoResponseDto> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody GrupoAcessoUpdateDto dto
    ) {
        return ResponseEntity.ok(grupoAcessoService.update(id, dto));
    }
}
