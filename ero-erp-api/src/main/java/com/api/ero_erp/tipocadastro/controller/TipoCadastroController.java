package com.api.ero_erp.tipocadastro.controller;

import com.api.ero_erp.tipocadastro.dtos.TipoCadastroCreateDto;
import com.api.ero_erp.tipocadastro.dtos.TipoCadastroUpdateDto;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import com.api.ero_erp.tipocadastro.service.TipoCadastroService;
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
@RequestMapping("/tipos/cadastro")
@Tag(name = "Tipo Cadastro", description = "Gerenciamento de tipos de cadastro")
public class TipoCadastroController {

    private final TipoCadastroService service;

    public TipoCadastroController(TipoCadastroService service) {
        this.service = service;
    }

    @Operation(
            summary     =     "Listar tipos de cadstro",
            description = "Retorna lista paginada de tipos de cadastro com filtro por nome"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description  = "Lista retornada com sucesso"
            )
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<TipoCadastro> getAll(
            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,

            @Parameter(description = "Filtro por nome")
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, nome);
    }

    @Operation(
            summary     = "Listar para select",
            description = "Retorna lista simples de tipos de cadastro (ativo = true)"
    )
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<TipoCadastro> select() {
        return service.select();
    }

    @Operation(
            summary     = "Buscar por ID",
            description = "Retorna um tipo de cadastro pelo ID"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public TipoCadastro findById(
            @Parameter(description = "ID do tipo de cadastro", example = "1")
            @PathVariable Long id
    ) {
        return service.findById(id);
    }

    @Operation(
            summary     = "Criar tipo de cadastro",
            description = "Cria um novo tipo de cadastro"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Criado com sucesso"),
            @ApiResponse(responseCode = "409", description = "Conflito (ex: nome já existente)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoCadastro> create(
            @RequestBody @Valid TipoCadastroCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @Operation(
            summary     = "Atualizar tipo de cadastro",
            description = "Atualiza parcialmente um tipo de cadastro"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoCadastro> update(
            @Parameter(description = "ID do tipo de cadastro", example = "1")
            @PathVariable Long id,

            @RequestBody @Valid TipoCadastroUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
