package com.api.ero_erp.pessoa.controller;

import com.api.ero_erp.pessoa.dtos.PessoaCreateDto;
import com.api.ero_erp.pessoa.dtos.PessoaResponseDto;
import com.api.ero_erp.pessoa.dtos.PessoaSelectDto;
import com.api.ero_erp.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
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
@RequestMapping("/pessoas")
@Tag(name = "Pessoa", description = "Gerenciamento de pessoas")
public class PessoaController {

    private final PessoaService pessoaService;

    public PessoaController(PessoaService pessoaService) {
        this.pessoaService = pessoaService;
    }

    @Operation(summary = "Listar pessoas", description = "Retorna lista paginada de pessoas com filtros opcionais")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PESSOA', 'PESSOA_GET')")
    public ResponseEntity<Page<PessoaResponseDto>> getAll(
            @PageableDefault(size = 20, sort = "nome") Pageable pageable,
            @Parameter(description = "Filtrar por nome")        @RequestParam(required = false) String     nome,
            @Parameter(description = "Filtrar por CPF")         @RequestParam(required = false) String     cpf,
            @Parameter(description = "Filtrar por RG")          @RequestParam(required = false) String     rg,
            @Parameter(description = "Filtrar por CNH")         @RequestParam(required = false) String     cnh,
            @Parameter(description = "Filtrar por CNPJ")        @RequestParam(required = false) String     cnpj,
            @Parameter(description = "Filtrar por ativo")       @RequestParam(required = false) Boolean    ativo,
            @Parameter(description = "Filtrar por tipo pessoa") @RequestParam(required = false) TipoPessoa tipoPessoa,
            @Parameter(description = "Filtrar por tipo cadastro") @RequestParam(required = false) Long     tipoCadastroId
    ) {
        return ResponseEntity.ok(
                pessoaService.getAll(pageable, nome, cpf, rg, cnh, cnpj, ativo, tipoPessoa, tipoCadastroId)
        );
    }

    @Operation(summary = "Select de pessoas", description = "Retorna lista simplificada de pessoas ativas para uso em combos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping("/select")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PessoaSelectDto>> select(
            @Parameter(description = "Filtrar por nome, CPF ou CNPJ") @RequestParam(required = false) String nome,
            @Parameter(description = "ID de pessoa a excluir dos resultados") @RequestParam(required = false) Long ignorarId
    ) {
        return ResponseEntity.ok(pessoaService.select(nome, ignorarId));
    }

    @Operation(summary = "Select de pessoas", description = "Retorna lista simplificada de pessoas ativas para uso em combos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    })
    @GetMapping("/select/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PessoaResponseDto> selectById(
            @Parameter(description = "ID da pessoa", example = "1")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(pessoaService.findByIdResponse(id));
    }

    @Operation(summary = "Buscar pessoa por ID", description = "Retorna uma pessoa pelo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pessoa encontrada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pessoa não encontrada")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PESSOA', 'PESSOA_GET')")
    public ResponseEntity<PessoaResponseDto> findById(
            @Parameter(description = "ID da pessoa", example = "1")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(pessoaService.findByIdResponse(id));
    }

    @Operation(summary = "Criar pessoa", description = "Cria uma nova pessoa física ou jurídica")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pessoa criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "409", description = "Documento já cadastrado")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PESSOA', 'PESSOA_POST')")
    public ResponseEntity<PessoaResponseDto> create(
            @RequestBody @Valid PessoaCreateDto dto
    ) {
        return new ResponseEntity<>(pessoaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualizar pessoa", description = "Atualiza os dados de uma pessoa")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pessoa atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Pessoa não encontrada"),
            @ApiResponse(responseCode = "409", description = "Documento já cadastrado")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PESSOA', 'PESSOA_POST')")
    public ResponseEntity<PessoaResponseDto> update(
            @Parameter(description = "ID da pessoa", example = "1")
            @PathVariable Long id,
            @RequestBody @Valid PessoaUpdateDto dto
    ) {
        return ResponseEntity.ok(pessoaService.update(id, dto));
    }

    @Operation(summary = "Alterar status da pessoa", description = "Ativa ou desativa uma pessoa")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status alterado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pessoa não encontrada")
    })
    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PESSOA', 'PESSOA_POST')")
    public ResponseEntity<PessoaResponseDto> alterarAtivo(
            @Parameter(description = "ID da pessoa", example = "1")
            @PathVariable Long id,
            @Parameter(description = "Status ativo/inativo", example = "true")
            @RequestParam Boolean ativo
    ) {
        return ResponseEntity.ok(pessoaService.alterarAtivo(id, ativo));
    }
}