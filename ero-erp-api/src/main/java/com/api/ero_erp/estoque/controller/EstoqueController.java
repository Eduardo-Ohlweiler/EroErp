package com.api.ero_erp.estoque.controller;

import com.api.ero_erp.estoque.dtos.*;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.estoque.service.EstoqueService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/estoque")
@Tag(name = "Estoque", description = "Controle de estoque por emitente")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    // ── ESTOQUE ──────────────────────────────────────────────────────────────

    @Operation(summary = "Lista registros de estoque com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_GET')")
    public Page<EstoqueResponseDto> getAll(
            @PageableDefault(size = 15, sort = "produto.nome") Pageable pageable,
            @RequestParam(required = false) Long    emitenteId,
            @RequestParam(required = false) String  produtoNome,
            @RequestParam(required = false) Boolean bloqueado
    ) {
        return estoqueService.getAll(pageable, emitenteId, produtoNome, bloqueado);
    }

    @Operation(summary = "Busca registro de estoque por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_GET')")
    public ResponseEntity<EstoqueResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(estoqueService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um registro de estoque inicial para um produto em um emitente")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE')")
    public ResponseEntity<EstoqueResponseDto> create(@Valid @RequestBody EstoqueCreateDto dto) {
        return new ResponseEntity<>(estoqueService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza preço de venda e status de bloqueio do estoque")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE')")
    public ResponseEntity<EstoqueResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody EstoqueUpdateDto dto
    ) {
        return ResponseEntity.ok(estoqueService.update(id, dto));
    }

    // ── ALERTAS ──────────────────────────────────────────────────────────────

    @Operation(summary = "Lista itens de estoque abaixo ou igual à quantidade mínima")
    @GetMapping("/alertas")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_GET')")
    public List<EstoqueAlertaDto> getAlertas() {
        return estoqueService.getAlertas();
    }

    // ── AJUSTE ───────────────────────────────────────────────────────────────

    @Operation(summary = "Realiza ajuste de quantidade no estoque")
    @PostMapping("/ajustes")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_AJUSTE')")
    public ResponseEntity<MovimentacaoResponseDto> ajustar(@Valid @RequestBody AjusteCreateDto dto) {
        return new ResponseEntity<>(estoqueService.ajustar(dto), HttpStatus.CREATED);
    }

    // ── TRANSFERÊNCIA ─────────────────────────────────────────────────────────

    @Operation(summary = "Realiza transferência de estoque entre emitentes")
    @PostMapping("/transferencias")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_TRANSFERENCIA')")
    public ResponseEntity<TransferenciaResponseDto> transferir(@Valid @RequestBody TransferenciaCreateDto dto) {
        return new ResponseEntity<>(estoqueService.transferir(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Lista histórico de transferências")
    @GetMapping("/transferencias")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_GET', 'ESTOQUE_TRANSFERENCIA')")
    public Page<TransferenciaResponseDto> getTransferencias(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) Long produtoId,
            @RequestParam(required = false) Long emitenteId
    ) {
        return estoqueService.getTransferencias(pageable, produtoId, emitenteId);
    }

    // ── MOVIMENTAÇÕES ─────────────────────────────────────────────────────────

    @Operation(summary = "Lista histórico de movimentações (auditoria)")
    @GetMapping("/movimentacoes")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ESTOQUE', 'ESTOQUE_GET')")
    public Page<MovimentacaoResponseDto> getMovimentacoes(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) Long             estoqueId,
            @RequestParam(required = false) Long             emitenteId,
            @RequestParam(required = false) TipoMovimentacao tipo
    ) {
        return estoqueService.getMovimentacoes(pageable, estoqueId, emitenteId, tipo);
    }
}
