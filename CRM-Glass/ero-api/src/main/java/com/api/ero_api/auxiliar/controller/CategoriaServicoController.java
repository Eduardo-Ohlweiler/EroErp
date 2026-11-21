package com.api.ero_api.auxiliar.controller;

import com.api.ero_api.auxiliar.dtos.CategoriaServicoCreateDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoResponseDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoSelectDto;
import com.api.ero_api.auxiliar.dtos.CategoriaServicoUpdateDto;
import com.api.ero_api.auxiliar.service.CategoriaServicoService;
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
 * Categorias de serviço (tela FormList, grupo CADASTROS_AUXILIARES). Não há
 * {@code GET /{id}}: a FormList edita a partir da linha da grade, que já traz a
 * {@code version}. O cadastro rápido do Form do serviço usa o mesmo POST (e a mesma
 * authority).
 */
@RestController
@RequestMapping("/api/categorias-servico")
@Tag(name = "Categorias de serviço", description = "Cadastro auxiliar do serviço")
public class CategoriaServicoController {

    private final CategoriaServicoService service;

    public CategoriaServicoController(CategoriaServicoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_LER')")
    @Operation(summary = "Lista as categorias de serviço (ativas e inativas)")
    public PaginaDto<CategoriaServicoResponseDto> listar(@PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Categorias de serviço para combos: só as ativas, ou também as inativas")
    public List<CategoriaServicoSelectDto> selecao(
            @Parameter(description = "true = traz também as inativas (a já gravada num serviço)")
            @RequestParam(defaultValue = "false") boolean inativos) {
        return service.listarParaSelecao(inativos);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Cadastra uma categoria de serviço (o código é gerado)")
    public ResponseEntity<CategoriaServicoResponseDto> criar(@Valid @RequestBody CategoriaServicoCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Altera o nome de uma categoria de serviço")
    public CategoriaServicoResponseDto atualizar(@PathVariable UUID id,
                                                 @Valid @RequestBody CategoriaServicoUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Inativa uma categoria de serviço (continua nos serviços que a usam)")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('CADASTROS_AUXILIARES_ESCREVER')")
    @Operation(summary = "Reativa uma categoria de serviço")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
