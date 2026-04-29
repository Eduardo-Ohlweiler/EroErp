package com.api.ero_erp.tipoendereco.controller;

import com.api.ero_erp.tipoendereco.dtos.TipoEnderecoCreateDto;
import com.api.ero_erp.tipoendereco.dtos.TipoEnderecoUpdateDto;
import com.api.ero_erp.tipoendereco.entity.TipoEndereco;
import com.api.ero_erp.tipoendereco.service.TipoEnderecoService;
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
@RequestMapping("/tipos/endereco")
@Tag(name = "Tipo Endereco", description = "Gerenciamento de tipos de endereço")
public class TipoEnderecoController {

    private final TipoEnderecoService service;

    public TipoEnderecoController(TipoEnderecoService service) {
        this.service = service;
    }

    @Operation(summary = "Listar tipos de endereço", description = "Retorna lista paginada de tipos de endereço com filtro por nome")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<TipoEndereco> getAll(
            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,

            @Parameter(description = "Filtro por nome")
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, nome);
    }

    @Operation(summary = "Listar para select", description = "Retorna lista simples de tipos de endereço (ativo = true)")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<TipoEndereco> select() {
        return service.select();
    }

    @Operation(summary = "Buscar por ID", description = "Retorna um tipo de endereço pelo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public TipoEndereco findById(
            @Parameter(description = "ID do tipo de endereço", example = "1")
            @PathVariable Long id
    ) {
        return service.findById(id);
    }

    @Operation(summary = "Criar tipo de endereço", description = "Cria um novo tipo de endereço")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Criado com sucesso"),
            @ApiResponse(responseCode = "409", description = "Conflito (ex: nome já existente)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoEndereco> create(
            @RequestBody @Valid TipoEnderecoCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualizar tipo de endereço", description = "Atualiza parcialmente um tipo de endereço")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoEndereco> update(
            @Parameter(description = "ID do tipo de endereço", example = "1")
            @PathVariable Long id,

            @RequestBody @Valid TipoEnderecoUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
