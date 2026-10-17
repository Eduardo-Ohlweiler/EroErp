package com.api.ero_erp.estoque.controller;

import com.api.ero_erp.estoque.dtos.AjusteDto;
import com.api.ero_erp.estoque.dtos.EntradaDto;
import com.api.ero_erp.estoque.dtos.EstoqueCreateDto;
import com.api.ero_erp.estoque.dtos.EstoqueMovimentavelDto;
import com.api.ero_erp.estoque.dtos.EstoqueResponseDto;
import com.api.ero_erp.estoque.dtos.EstoqueUpdateDto;
import com.api.ero_erp.estoque.dtos.MovimentacaoResponseDto;
import com.api.ero_erp.estoque.dtos.TransferenciaDto;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.estoque.service.EstoqueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Estoque de produto por filial — tela {@code ESTOQUE}: leitura nos GET,
 * escrita no cadastro e nas movimentações. Não há {@code /select} aberto: o
 * combo das movimentações traz saldo, que é dado do estoque.
 *
 * <p>As rotas literais ({@code /movimentacoes}, {@code /movimentaveis},
 * {@code /transferencias}) convivem com {@code /{id}} porque o Spring prefere
 * o literal.
 */
@RestController
@RequestMapping("/estoques")
@RequiredArgsConstructor
@Tag(name = "Estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    @GetMapping
    @PreAuthorize("hasAuthority('ESTOQUE_LER')")
    @Operation(summary = "Estoque do tenant, por produto e filial",
            description = "`termo` procura no nome do produto e, quando é número, no código e no EAN exatos.")
    public ResponseEntity<Page<EstoqueResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) Boolean controla,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(estoqueService.getAll(pageable, termo, filialId, produtoId, controla, ativo));
    }

    @GetMapping("/movimentaveis")
    @PreAuthorize("hasAuthority('ESTOQUE_LER')")
    @Operation(summary = "O que se movimenta numa filial, para combo",
            description = "Linha ativa, com controle de estoque, de produto ativo. Traz o saldo.")
    public ResponseEntity<List<EstoqueMovimentavelDto>> movimentaveis(@RequestParam UUID filialId,
                                                                      @RequestParam(required = false) String termo) {
        return ResponseEntity.ok(estoqueService.movimentaveis(filialId, termo));
    }

    @GetMapping("/movimentacoes")
    @PreAuthorize("hasAuthority('ESTOQUE_LER')")
    @Operation(summary = "Histórico de movimentações, do mais novo ao mais antigo",
            description = "`ate` é exclusivo. A quantidade vem com sinal.")
    public ResponseEntity<Page<MovimentacaoResponseDto>> movimentacoes(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) UUID estoqueId,
            @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant ate) {
        return ResponseEntity.ok(estoqueService.movimentacoes(pageable, estoqueId, filialId, produtoId,
                tipo, de, ate));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTOQUE_LER')")
    @Operation(summary = "Detalha uma linha de estoque")
    public ResponseEntity<EstoqueResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(estoqueService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Abre o estoque de um produto numa filial",
            description = "Quantidade inicial maior que zero vira uma ENTRADA \"Saldo inicial\".")
    public ResponseEntity<EstoqueResponseDto> create(@Valid @RequestBody EstoqueCreateDto dto) {
        EstoqueResponseDto criado = estoqueService.create(dto);
        return ResponseEntity.created(URI.create("/estoques/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Altera preço, controle e mínimo", description = "Não toca na quantidade.")
    public ResponseEntity<EstoqueResponseDto> update(@PathVariable UUID id,
                                                     @Valid @RequestBody EstoqueUpdateDto dto) {
        return ResponseEntity.ok(estoqueService.update(id, dto));
    }

    @PatchMapping("/{id}/ativo")
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Ativa ou inativa a linha", description = "Estoque não se apaga — inativa-se.")
    public ResponseEntity<EstoqueResponseDto> alterarAtivo(@PathVariable UUID id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(estoqueService.alterarAtivo(id, ativo));
    }

    @PostMapping("/{id}/entradas")
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Entrada manual: soma ao saldo")
    public ResponseEntity<MovimentacaoResponseDto> entrada(@PathVariable UUID id,
                                                           @Valid @RequestBody EntradaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estoqueService.entrada(id, dto));
    }

    @PostMapping("/{id}/ajustes")
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Ajuste: informa a quantidade contada",
            description = "O movimento grava a diferença com o sinal dela. Motivo obrigatório.")
    public ResponseEntity<MovimentacaoResponseDto> ajuste(@PathVariable UUID id,
                                                          @Valid @RequestBody AjusteDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estoqueService.ajuste(id, dto));
    }

    @PostMapping("/transferencias")
    @PreAuthorize("hasAuthority('ESTOQUE_ESCREVER')")
    @Operation(summary = "Transfere saldo entre filiais",
            description = "Devolve os dois movimentos: a saída na origem e a entrada no destino.")
    public ResponseEntity<List<MovimentacaoResponseDto>> transferir(@Valid @RequestBody TransferenciaDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estoqueService.transferir(dto));
    }
}
