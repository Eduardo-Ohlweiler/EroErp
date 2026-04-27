package com.api.ero_erp.tipoemail.controller;

import com.api.ero_erp.tipoemail.dtos.TipoEmailCreateDto;
import com.api.ero_erp.tipoemail.dtos.TipoEmailUpdateDto;
import com.api.ero_erp.tipoemail.entity.TipoEmail;
import com.api.ero_erp.tipoemail.service.TipoEmailService;
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
@RequestMapping("/tipos/email")
@Tag(name = "Tipo Email", description = "Gerenciamento de tipos de email")
public class TipoEmailController {

    private final TipoEmailService service;

    public TipoEmailController(TipoEmailService service) {
        this.service = service;
    }

    @Operation(
            summary     =     "Listar tipos de email",
            description = "Retorna lista paginada de tipos de email com filtro por nome"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description  = "Lista retornada com sucesso"
            )
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<TipoEmail> getAll(
            @Parameter(description = "Paginação e ordenação")
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,

            @Parameter(description = "Filtro por nome")
            @RequestParam(required = false) String nome
    ) {
        return service.getAll(pageable, nome);
    }

    @Operation(
            summary     = "Listar para select",
            description = "Retorna lista simples de tipos de email (ativo = true)"
    )
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public List<TipoEmail> select() {
        return service.select();
    }

    @Operation(
            summary     = "Buscar por ID",
            description = "Retorna um tipo de email pelo ID"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Encontrado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public TipoEmail findById(
            @Parameter(description = "ID do tipo de email", example = "1")
            @PathVariable Long id
    ) {
        return service.findById(id);
    }

    @Operation(
            summary     = "Criar tipo de telefone",
            description = "Cria um novo tipo de telefone"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Criado com sucesso"),
            @ApiResponse(responseCode = "409", description = "Conflito (ex: nome já existente)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoEmail> create(
            @RequestBody @Valid TipoEmailCreateDto dto
    ) {
        return new ResponseEntity<>(service.create(dto), HttpStatus.CREATED);
    }

    @Operation(
            summary     = "Atualizar tipo de email",
            description = "Atualiza parcialmente um tipo de telefone"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<TipoEmail> update(
            @Parameter(description = "ID do tipo de email", example = "1")
            @PathVariable Long id,

            @RequestBody @Valid TipoEmailUpdateDto dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }
}
