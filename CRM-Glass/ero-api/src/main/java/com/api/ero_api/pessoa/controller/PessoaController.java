package com.api.ero_api.pessoa.controller;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.pessoa.dtos.PessoaCreateDto;
import com.api.ero_api.pessoa.dtos.PessoaListaDto;
import com.api.ero_api.pessoa.dtos.PessoaResponseDto;
import com.api.ero_api.pessoa.dtos.PessoaSelectDto;
import com.api.ero_api.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_api.pessoa.enums.TipoPessoa;
import com.api.ero_api.pessoa.service.PessoaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Pessoas (telas pessoa-list e pessoa-form, grupo PESSOAS). O {@code /selecao} exige
 * PESSOAS_LER, e não ACESSO_LIBERADO: nome de pessoa é dado pessoal.
 */
@RestController
@RequestMapping("/api/pessoas")
@Tag(name = "Pessoas", description = "Pessoas físicas e jurídicas do contratante")
public class PessoaController {

    private final PessoaService service;

    public PessoaController(PessoaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PESSOAS_LER')")
    @Operation(summary = "Lista pessoas com filtro e paginação (também serve à exportação: sem nascimento nem RG)")
    public PaginaDto<PessoaListaDto> listar(
            @Parameter(description = "Código exato") @RequestParam(required = false)
            @Positive(message = "Código deve ser maior que zero") Long codPessoa,
            @Parameter(description = "Parte do nome ou da fantasia, sem diferenciar acento nem maiúsculas")
            @RequestParam(required = false) @Size(max = 100, message = "Busca muito longa") String busca,
            @Parameter(description = "Parte do CPF ou do CNPJ, com ou sem máscara")
            @RequestParam(required = false) @Size(max = 18, message = "Documento muito longo") String documento,
            @Parameter(description = "FISICA ou JURIDICA (vazio = todas)") @RequestParam(required = false) TipoPessoa tipoPessoa,
            @Parameter(description = "Id do tipo de cadastro (vazio = todos)") @RequestParam(required = false) UUID tipoCadastroId,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(codPessoa, busca, documento, tipoPessoa, tipoCadastroId, ativo, pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('PESSOAS_LER')")
    @Operation(summary = "Pessoas ativas para combo (id, código e nome), até 20, por nome")
    public List<PessoaSelectDto> selecao(
            @Parameter(description = "Parte do nome ou da fantasia") @RequestParam(required = false)
            @Size(max = 100, message = "Busca muito longa") String busca,
            @Parameter(description = "Pessoa que não entra na lista (a própria, no vínculo)")
            @RequestParam(required = false) UUID ignorarId) {
        return service.listarParaSelecao(busca, ignorarId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PESSOAS_LER')")
    @Operation(summary = "Busca uma pessoa (ficha completa, com filhas e vínculos)")
    public PessoaResponseDto buscar(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Cadastra uma pessoa (o código é gerado)")
    public ResponseEntity<PessoaResponseDto> criar(@Valid @RequestBody PessoaCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Altera uma pessoa (cada lista substitui a anterior)")
    public PessoaResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody PessoaUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Inativa uma pessoa (some dos combos; os vínculos continuam)")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Reativa uma pessoa")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
