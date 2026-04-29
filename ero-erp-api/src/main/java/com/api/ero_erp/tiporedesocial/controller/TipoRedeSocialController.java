package com.api.ero_erp.tiporedesocial.controller;

import com.api.ero_erp.tiporedesocial.TipoRedeSocialService;
import com.api.ero_erp.tiporedesocial.dtos.TipoRedeSocialCreateDto;
import com.api.ero_erp.tiporedesocial.dtos.TipoRedeSocialUpdateDto;
import com.api.ero_erp.tiporedesocial.entity.TipoRedeSocial;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@RequestMapping("/tipos/redesocial")
@Tag(name = "Tipo rede social", description = "Gerenciamento de tipos de rede social")
public class TipoRedeSocialController {

    private final TipoRedeSocialService service;

    public TipoRedeSocialController(TipoRedeSocialService service) {
        this.service = service;
    }

    @Operation(summary = "Listar tipos de rede social", description = "Retorna lista paginada de tipos de rede social com filtro por nome")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<TipoRedeSocial> getAll(
            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,

            @Parameter(description = "Filtro por nome")
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, nome);
    }

    @Operation(summary = "Listar para select", description = "Retorna lista simples de tipos de rede social (ativo = true)")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<TipoRedeSocial> select() {
        return service.select();
    }

    @Operation(summary = "Buscar por ID", description = "Retorna um tipo de rede social pelo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public TipoRedeSocial findById(
            @Parameter(description = "ID do tipo de rede social", example = "1")
            @PathVariable Long id
    ) {
        return service.findById(id);
    }

    @Operation(summary = "Criar tipo de rede social", description = "Cria um novo tipo de rede social")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Criado com sucesso"),
            @ApiResponse(responseCode = "409", description = "Conflito (ex: nome já existente)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoRedeSocial> create(
            @RequestBody @Valid TipoRedeSocialCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualizar tipo de rede social", description = "Atualiza parcialmente um tipo de rede social")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoRedeSocial> update(
            @Parameter(description = "ID do tipo de rede social", example = "1")
            @PathVariable Long id,

            @RequestBody @Valid TipoRedeSocialUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
