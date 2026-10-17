package com.api.ero_erp.servico.controller;

import com.api.ero_erp.servico.dtos.ServicoCreateDto;
import com.api.ero_erp.servico.dtos.ServicoResponseDto;
import com.api.ero_erp.servico.dtos.ServicoSelectDto;
import com.api.ero_erp.servico.dtos.ServicoUpdateDto;
import com.api.ero_erp.servico.service.ServicoService;
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
 * Cadastro de serviços — módulo de negócio. Cada método exige a permissão da
 * tela {@code SERVICOS}: leitura nos GET, escrita no resto. ADMIN e
 * SUPERADMIN têm as duas.
 *
 * <p>O {@code isAuthenticated()} da classe fica para o {@code /select}: os
 * módulos que vierem (pedido, ordem de serviço) escolhem o serviço num combo
 * sem precisar da permissão do cadastro.
 */
@RestController
@RequestMapping("/servicos")
@RequiredArgsConstructor
@Tag(name = "Serviços")
@PreAuthorize("isAuthenticated()")
public class ServicoController {

    private final ServicoService servicoService;

    @GetMapping
    @PreAuthorize("hasAuthority('SERVICOS_LER')")
    @Operation(summary = "Lista os serviços do tenant",
            description = """
                    `termo` procura no nome e, quando é número, no código.
                    `filialId` traz os serviços que têm linha naquela filial.""")
    public ResponseEntity<Page<ServicoResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(servicoService.getAll(pageable, termo, filialId, ativo));
    }

    @GetMapping("/select")
    @Operation(summary = "Serviços ativos para combo", description = "Busca por nome ou código. Sem valores.")
    public ResponseEntity<List<ServicoSelectDto>> select(@RequestParam(required = false) String termo) {
        return ResponseEntity.ok(servicoService.select(termo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SERVICOS_LER')")
    @Operation(summary = "Detalha um serviço")
    public ResponseEntity<ServicoResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(servicoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Cadastra um serviço", description = "O código é gerado pelo sistema.")
    public ResponseEntity<ServicoResponseDto> create(@Valid @RequestBody ServicoCreateDto dto) {
        ServicoResponseDto criado = servicoService.create(dto);
        return ResponseEntity.created(URI.create("/servicos/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Altera um serviço",
            description = "A lista de filiais é o estado completo: a filial que não vier sai.")
    public ResponseEntity<ServicoResponseDto> update(@PathVariable UUID id,
                                                     @Valid @RequestBody ServicoUpdateDto dto) {
        return ResponseEntity.ok(servicoService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Ativa ou inativa um serviço", description = "Serviço não se apaga — inativa-se.")
    public ResponseEntity<ServicoResponseDto> alterarAtivo(@PathVariable UUID id,
                                                           @RequestParam boolean ativo) {
        return ResponseEntity.ok(servicoService.alterarAtivo(id, ativo));
    }
}
