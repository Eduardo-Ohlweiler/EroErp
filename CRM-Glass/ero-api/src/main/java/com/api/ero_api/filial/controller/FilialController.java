package com.api.ero_api.filial.controller;

import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.filial.dtos.FilialCreateDto;
import com.api.ero_api.filial.dtos.FilialResponseDto;
import com.api.ero_api.filial.dtos.FilialSelectDto;
import com.api.ero_api.filial.dtos.FilialUpdateDto;
import com.api.ero_api.filial.enums.TipoFilial;
import com.api.ero_api.filial.service.FilialService;
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
 * Filiais (telas filial-list e filial-form, grupo FILIAIS). O {@code /selecao} é
 * ACESSO_LIBERADO (combos das outras telas) e por isso não leva CPF nem CNPJ.
 */
@RestController
@RequestMapping("/api/filiais")
@Tag(name = "Filiais", description = "Matrizes e filiais do contratante")
public class FilialController {

    private final FilialService service;

    public FilialController(FilialService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('FILIAIS_LER')")
    @Operation(summary = "Lista filiais com filtro e paginação, cada matriz seguida das suas filiais (sem ordenação)")
    public PaginaDto<FilialResponseDto> listar(
            @Parameter(description = "Código exato") @RequestParam(required = false)
            @Positive(message = "Código deve ser maior que zero") Long codFilial,
            @Parameter(description = "Parte do nome ou da fantasia da pessoa, sem diferenciar acento nem maiúsculas")
            @RequestParam(required = false) @Size(max = 100, message = "Busca muito longa") String busca,
            @Parameter(description = "Parte do CPF ou do CNPJ, com ou sem máscara")
            @RequestParam(required = false) @Size(max = 18, message = "Documento muito longo") String documento,
            @Parameter(description = "MATRIZ ou FILIAL (vazio = todas)") @RequestParam(required = false) TipoFilial tipo,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listar(codFilial, busca, documento, tipo, ativo, pageable);
    }

    @GetMapping("/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Filiais ativas para combo (id, código, nome, tipo e cor), até 20, por nome")
    public List<FilialSelectDto> selecao(
            @Parameter(description = "Parte do nome ou da fantasia") @RequestParam(required = false)
            @Size(max = 100, message = "Busca muito longa") String busca,
            @Parameter(description = "MATRIZ ou FILIAL (vazio = todas)") @RequestParam(required = false) TipoFilial tipo,
            @Parameter(description = "Filial que não entra na lista (a própria, no combo de matriz)")
            @RequestParam(required = false) UUID ignorarId) {
        return service.listarParaSelecao(busca, tipo, ignorarId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FILIAIS_LER')")
    @Operation(summary = "Busca uma filial")
    public FilialResponseDto buscar(@PathVariable UUID id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Cadastra uma filial (o código é gerado)")
    public ResponseEntity<FilialResponseDto> criar(@Valid @RequestBody FilialCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Altera uma filial (pessoa, tipo, matriz e cor)")
    public FilialResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody FilialUpdateDto dto) {
        return service.atualizar(id, dto);
    }

    @PatchMapping("/{id}/inativar")
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Inativa uma filial (a matriz só sem filial ativa)")
    public ResponseEntity<Void> inativar(@PathVariable UUID id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('FILIAIS_ESCREVER')")
    @Operation(summary = "Reativa uma filial (a filial só com a matriz ativa)")
    public ResponseEntity<Void> ativar(@PathVariable UUID id) {
        service.ativar(id);
        return ResponseEntity.noContent().build();
    }
}
