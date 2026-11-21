package com.api.ero_api.servico.controller;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.servico.dtos.ServicoCreateDto;
import com.api.ero_api.servico.dtos.ServicoResponseDto;
import com.api.ero_api.servico.dtos.ServicoSelectDto;
import com.api.ero_api.servico.dtos.ServicoUpdateDto;
import com.api.ero_api.servico.service.ServicoService;
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
 * Serviços (telas servico-list e servico-form, grupo SERVICOS). O {@code /selecao} é
 * ACESSO_LIBERADO (combos das outras telas) e por isso nunca leva preço.
 */
@RestController
@RequestMapping("/api/servicos")
@Tag(name = "Serviços", description = "O que o contratante presta, onde e por quanto")
public class ServicoController {

    private final ServicoService service;

    public ServicoController(ServicoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SERVICOS_LER')")
    @Operation(summary = "Lista serviços com filtro e paginação (ordena por nome ou código)")
    public PaginaDto<ServicoResponseDto> listar(
            @Parameter(description = "Código exato") @RequestParam(required = false)
            @Positive(message = "Código deve ser maior que zero") Long codServico,
            @Parameter(description = "Parte do nome, sem diferenciar acento nem maiúsculas")
            @RequestParam(required = false) @Size(max = 150, message = "Busca muito longa") String busca,
            @Parameter(description = "Só os da categoria") @RequestParam(required = false) UUID categoriaId,
            @Parameter(description = "Só os prestados nesta filial") @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(codServico, busca, categoriaId, filialId, ativo, pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Serviços ativos para combo (id, código e nome; sem preço), até 20, por nome")
    public List<ServicoSelectDto> selecao(
            @Parameter(description = "Parte do nome") @RequestParam(required = false)
            @Size(max = 150, message = "Busca muito longa") String busca) {
        return service.listarParaSelecao(busca);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SERVICOS_LER')")
    @Operation(summary = "Busca um serviço, com as filiais e os preços")
    public ServicoResponseDto buscar(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Cadastra um serviço (o código é gerado)")
    public ResponseEntity<ServicoResponseDto> criar(@Valid @RequestBody ServicoCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Altera um serviço (a lista de filiais substitui a anterior)")
    public ServicoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody ServicoUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Inativa um serviço")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('SERVICOS_ESCREVER')")
    @Operation(summary = "Reativa um serviço")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
