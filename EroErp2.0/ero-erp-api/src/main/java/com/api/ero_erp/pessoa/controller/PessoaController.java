package com.api.ero_erp.pessoa.controller;

import com.api.ero_erp.pessoa.dtos.PessoaCreateDto;
import com.api.ero_erp.pessoa.dtos.PessoaResponseDto;
import com.api.ero_erp.pessoa.dtos.PessoaSelectDto;
import com.api.ero_erp.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * Cadastro de pessoas — módulo de negócio, e não área administrativa. Cada
 * método exige a permissão da tela {@code PESSOAS} ({@code Tela}): leitura nos
 * GET, escrita no resto. ADMIN e SUPERADMIN têm as duas.
 *
 * <p>O {@code isAuthenticated()} da classe fica para o {@code /select}: ele
 * devolve só o que um combo precisa e serve outras telas (o vínculo, e os
 * módulos que vierem), então não exige a permissão de Pessoas.
 *
 * <p>O isolamento vem do tenant efetivo do token, não da permissão.
 */
@RestController
@RequestMapping("/pessoas")
@RequiredArgsConstructor
@Tag(name = "Pessoas")
@PreAuthorize("isAuthenticated()")
public class PessoaController {

    private final PessoaService pessoaService;

    @GetMapping
    @PreAuthorize("hasAuthority('PESSOAS_LER')")
    @Operation(summary = "Lista as pessoas do tenant",
            description = "O filtro `documento` procura em CPF e CNPJ, com ou sem máscara.")
    public ResponseEntity<Page<PessoaResponseDto>> getAll(
            @PageableDefault(size = 20, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String documento,
            @RequestParam(required = false) TipoPessoa tipoPessoa,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) UUID tipoCadastroId) {
        return ResponseEntity.ok(
                pessoaService.getAll(pageable, nome, documento, tipoPessoa, ativo, tipoCadastroId));
    }

    @GetMapping("/select")
    @Operation(summary = "Pessoas ativas para combo",
            description = """
                    Busca por nome, CPF ou CNPJ. `tipoCadastroId` restringe a um
                    tipo; `ignorarId` tira uma pessoa do resultado — é como o
                    combo de vínculo evita oferecer a própria pessoa.""")
    public ResponseEntity<List<PessoaSelectDto>> select(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) UUID tipoCadastroId,
            @RequestParam(required = false) UUID ignorarId) {
        return ResponseEntity.ok(pessoaService.select(termo, tipoCadastroId, ignorarId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PESSOAS_LER')")
    @Operation(summary = "Detalha uma pessoa, com contatos")
    public ResponseEntity<PessoaResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(pessoaService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Cadastra uma pessoa")
    public ResponseEntity<PessoaResponseDto> create(@Valid @RequestBody PessoaCreateDto dto) {
        PessoaResponseDto criada = pessoaService.create(dto);
        return ResponseEntity.created(URI.create("/pessoas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Altera uma pessoa",
            description = """
                    As listas de contato são o estado completo: item com `id`
                    é atualizado, sem `id` é criado, e o que não vier é
                    removido.""")
    public ResponseEntity<PessoaResponseDto> update(@PathVariable UUID id,
                                                    @Valid @RequestBody PessoaUpdateDto dto) {
        return ResponseEntity.ok(pessoaService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('PESSOAS_ESCREVER')")
    @Operation(summary = "Ativa ou inativa uma pessoa",
            description = "Cadastro de pessoa não se apaga — inativa-se.")
    public ResponseEntity<PessoaResponseDto> alterarAtivo(@PathVariable UUID id,
                                                          @RequestParam boolean ativo) {
        return ResponseEntity.ok(pessoaService.alterarAtivo(id, ativo));
    }
}
