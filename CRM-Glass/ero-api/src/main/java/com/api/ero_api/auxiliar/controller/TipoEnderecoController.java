package com.api.ero_api.auxiliar.controller;

import com.api.ero_api.auxiliar.dtos.TipoEnderecoCreateDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoResponseDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoSelectDto;
import com.api.ero_api.auxiliar.dtos.TipoEnderecoUpdateDto;
import com.api.ero_api.auxiliar.service.TipoEnderecoService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
 * Tipos de endereço (tela FormList, grupo CADASTROS_AUXILIARES). Não há {@code GET /{id}}:
 * a FormList edita a partir da linha da grade, que já traz a {@code version}.
 */
@RestController
@RequestMapping("/api/tipos-endereco")
@Tag(name = "Tipos de endereço", description = "Cadastro auxiliar da pessoa")
public class TipoEnderecoController {

    private final TipoEnderecoService service;

    public TipoEnderecoController(TipoEnderecoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_LER')")
    @Operation(summary = "Lista os tipos de endereço (do sistema e do contratante, ativos e inativos)")
    public PaginaDto<TipoEnderecoResponseDto> listar(@PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Tipos de endereço para combos: só os ativos, ou também os inativos")
    public List<TipoEnderecoSelectDto> selecao(
            @Parameter(description = "true = traz também os inativos (o já gravado numa pessoa)")
            @RequestParam(defaultValue = "false") boolean inativos) {
        return service.listarParaSelecao(inativos);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Cadastra um tipo de endereço do contratante (o código é gerado)")
    public ResponseEntity<TipoEnderecoResponseDto> criar(@Valid @RequestBody TipoEnderecoCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Altera o nome de um tipo de endereço do contratante (item do sistema: 422)")
    public TipoEnderecoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody TipoEnderecoUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Inativa um tipo de endereço do contratante (item do sistema: 422)")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Reativa um tipo de endereço do contratante (item do sistema: 422)")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
