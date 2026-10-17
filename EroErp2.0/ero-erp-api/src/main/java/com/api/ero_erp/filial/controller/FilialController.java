package com.api.ero_erp.filial.controller;

import com.api.ero_erp.filial.dtos.FilialCreateDto;
import com.api.ero_erp.filial.dtos.FilialResponseDto;
import com.api.ero_erp.filial.dtos.FilialSelectDto;
import com.api.ero_erp.filial.dtos.FilialUpdateDto;
import com.api.ero_erp.filial.enums.TipoFilial;
import com.api.ero_erp.filial.service.FilialService;
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
 * Cadastro de filiais — módulo de negócio. Cada método exige a permissão da
 * tela {@code FILIAIS}: leitura nos GET, escrita no resto. ADMIN e SUPERADMIN
 * têm as duas.
 *
 * <p>O {@code isAuthenticated()} da classe fica para o {@code /select}: os
 * módulos que vierem (pedido, estoque, financeiro) escolhem a filial num
 * combo sem precisar da permissão do cadastro.
 */
@RestController
@RequestMapping("/filiais")
@RequiredArgsConstructor
@Tag(name = "Filiais")
@PreAuthorize("isAuthenticated()")
public class FilialController {

    private final FilialService filialService;

    @GetMapping
    @PreAuthorize("hasAuthority('FILIAIS_LER')")
    @Operation(summary = "Lista as filiais do tenant",
            description = "Cada matriz vem seguida das suas filiais. `documento` procura em CPF e CNPJ.")
    public ResponseEntity<Page<FilialResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String documento,
            @RequestParam(required = false) TipoFilial tipo,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(filialService.getAll(pageable, nome, documento, tipo, ativo));
    }

    @GetMapping("/select")
    @Operation(summary = "Filiais ativas para combo",
            description = """
                    Busca por nome, fantasia, CPF ou CNPJ. `tipo=MATRIZ` é o
                    combo de matriz do cadastro; `ignorarId` tira a própria
                    filial do resultado.""")
    public ResponseEntity<List<FilialSelectDto>> select(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) TipoFilial tipo,
            @RequestParam(required = false) UUID ignorarId) {
        return ResponseEntity.ok(filialService.select(termo, tipo, ignorarId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FILIAIS_LER')")
    @Operation(summary = "Detalha uma filial")
    public ResponseEntity<FilialResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(filialService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Cadastra uma filial ou matriz")
    public ResponseEntity<FilialResponseDto> create(@Valid @RequestBody FilialCreateDto dto) {
        FilialResponseDto criada = filialService.create(dto);
        return ResponseEntity.created(URI.create("/filiais/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Altera uma filial")
    public ResponseEntity<FilialResponseDto> update(@PathVariable UUID id,
                                                    @Valid @RequestBody FilialUpdateDto dto) {
        return ResponseEntity.ok(filialService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Ativa ou inativa uma filial",
            description = "Filial não se apaga — inativa-se. Matriz com filial ativa não inativa.")
    public ResponseEntity<FilialResponseDto> alterarAtivo(@PathVariable UUID id,
                                                          @RequestParam boolean ativo) {
        return ResponseEntity.ok(filialService.alterarAtivo(id, ativo));
    }
}
