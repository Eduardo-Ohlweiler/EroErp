package com.api.ero_api.auditoria.controller;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.ConsultaEventoService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@Tag(name = "Auditoria", description = "Trilha de eventos de segurança")
public class AuditoriaController {

    private final ConsultaEventoService service;

    public AuditoriaController(ConsultaEventoService service) {
        this.service = service;
    }

    @GetMapping("/eventos")
    @PreAuthorize("hasAuthority('AUDITORIA_LER')")
    @Operation(summary = "Lista eventos de segurança (mais recentes primeiro; padrão: últimos 7 dias)")
    public PaginaDto<EventoSegurancaResponseDto> listar(
            @Parameter(description = "Tipos de evento (vazio = todos). Repita o parâmetro ou separe por vírgula.")
            @RequestParam(required = false) @Size(max = 50, message = "Tipos demais") List<TipoEventoSeguranca> tipos,
            @Parameter(description = "Usuário afetado") @RequestParam(required = false) UUID usuarioId,
            @Parameter(description = "Contratante (só na visão de plataforma; ignorado dentro de um contratante)")
            @RequestParam(required = false) UUID tenantId,
            @Parameter(description = "Início do período, ISO-8601 UTC (inclusivo). Padrão: 7 dias antes do fim.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant de,
            @Parameter(description = "Fim do período, ISO-8601 UTC (exclusivo). Padrão: agora.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant ate,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listar(tipos, usuarioId, tenantId, de, ate, pageable);
    }
}
