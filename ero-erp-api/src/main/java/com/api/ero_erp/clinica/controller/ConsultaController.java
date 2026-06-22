package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dtos.*;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.clinica.service.ConsultaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/consultas")
@Tag(name = "Clínica — Consultas", description = "Agendamento e atendimento de consultas")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    @Operation(summary = "Lista consultas com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public Page<ConsultaResponseDto> getAll(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) StatusConsulta status,
            @RequestParam(required = false) Long           emitenteId,
            @RequestParam(required = false) Long           pessoaId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim,
            @RequestParam(required = false) String         nomePessoa,
            @RequestParam(required = false) Boolean        faturado
    ) {
        return consultaService.getAll(pageable, status, emitenteId, pessoaId, inicio, fim, nomePessoa, faturado);
    }

    @Operation(summary = "Lista compromissos da agenda disponíveis para vincular a uma consulta")
    @GetMapping("/compromissos-disponiveis")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public List<CompromissoDisponivelDto> compromissosDisponiveis() {
        return consultaService.listarCompromissosDisponiveis();
    }

    @Operation(summary = "Busca um compromisso disponível por id (para exibir no seletor)")
    @GetMapping("/compromissos-disponiveis/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public CompromissoDisponivelDto compromissoDisponivel(@PathVariable Long id) {
        return consultaService.buscarCompromissoDisponivel(id);
    }

    @Operation(summary = "Busca consulta por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public ResponseEntity<ConsultaResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(consultaService.findByIdResponse(id));
    }

    @Operation(summary = "Cria consulta e gera compromisso automaticamente")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> create(@Valid @RequestBody ConsultaCreateDto dto) {
        return new ResponseEntity<>(consultaService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza info básica da consulta (emitente, pessoa, horários, observação)")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaUpdateDto dto
    ) {
        return ResponseEntity.ok(consultaService.update(id, dto));
    }

    @Operation(summary = "Inicia o atendimento (AGENDADA → EM_ATENDIMENTO)")
    @PatchMapping("/{id}/iniciar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> iniciar(@PathVariable Long id) {
        return ResponseEntity.ok(consultaService.iniciar(id));
    }

    @Operation(summary = "Conclui a consulta e baixa estoque dos produtos consumidos")
    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> concluir(@PathVariable Long id) {
        return ResponseEntity.ok(consultaService.concluir(id));
    }

    @Operation(summary = "Marca a consulta como faturada (conclui antes, se ainda em atendimento)")
    @PatchMapping("/{id}/faturar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> faturar(@PathVariable Long id) {
        return ResponseEntity.ok(consultaService.faturar(id));
    }

    @Operation(summary = "Cancela a consulta")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> cancelar(
            @PathVariable Long id,
            @RequestBody(required = false) CancelarConsultaDto dto
    ) {
        return ResponseEntity.ok(consultaService.cancelar(id, dto != null ? dto.motivo() : null));
    }

    @Operation(summary = "Gera uma reconsulta (nova consulta + novo compromisso, copiando os serviços)")
    @PostMapping("/{id}/reconsuita")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaResponseDto> gerarReconsulta(
            @PathVariable Long id,
            @Valid @RequestBody ReconsultaCreateDto dto
    ) {
        return new ResponseEntity<>(consultaService.gerarReconsulta(id, dto), HttpStatus.CREATED);
    }

    // ── Serviços ──────────────────────────────────────────────────────────────

    @Operation(summary = "Adiciona serviço à consulta")
    @PostMapping("/{id}/servicos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaServicoResponseDto> adicionarServico(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaServicoCreateDto dto
    ) {
        return new ResponseEntity<>(consultaService.adicionarServico(id, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza serviço da consulta")
    @PutMapping("/{id}/servicos/{servicoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaServicoResponseDto> atualizarServico(
            @PathVariable Long id,
            @PathVariable Long servicoId,
            @Valid @RequestBody ConsultaServicoCreateDto dto
    ) {
        return ResponseEntity.ok(consultaService.atualizarServico(id, servicoId, dto));
    }

    @Operation(summary = "Remove serviço da consulta")
    @DeleteMapping("/{id}/servicos/{servicoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<Void> removerServico(
            @PathVariable Long id,
            @PathVariable Long servicoId
    ) {
        consultaService.removerServico(id, servicoId);
        return ResponseEntity.noContent().build();
    }

    // ── WhatsApp / PDF ────────────────────────────────────────────────────────

    @Operation(summary = "Envia um PDF (base64) para o paciente via WhatsApp")
    @PostMapping("/{id}/enviar-pdf")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<Void> enviarPdfWhatsapp(
            @PathVariable Long id,
            @RequestBody EnviarPdfConsultaDto dto
    ) {
        consultaService.enviarPdfWhatsapp(id, dto);
        return ResponseEntity.noContent().build();
    }

    // ── Produtos consumidos ───────────────────────────────────────────────────

    @Operation(summary = "Adiciona produto consumido à consulta")
    @PostMapping("/{id}/produtos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaProdutoResponseDto> adicionarProduto(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaProdutoCreateDto dto
    ) {
        return new ResponseEntity<>(consultaService.adicionarProduto(id, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza produto consumido da consulta")
    @PutMapping("/{id}/produtos/{produtoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<ConsultaProdutoResponseDto> atualizarProduto(
            @PathVariable Long id,
            @PathVariable Long produtoId,
            @Valid @RequestBody ConsultaProdutoCreateDto dto
    ) {
        return ResponseEntity.ok(consultaService.atualizarProduto(id, produtoId, dto));
    }

    @Operation(summary = "Remove produto consumido da consulta")
    @DeleteMapping("/{id}/produtos/{produtoId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<Void> removerProduto(
            @PathVariable Long id,
            @PathVariable Long produtoId
    ) {
        consultaService.removerProduto(id, produtoId);
        return ResponseEntity.noContent().build();
    }
}
