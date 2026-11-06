package com.api.ero_api.auditoria.controller;

import com.api.ero_api.auditoria.dtos.EventoSegurancaResponseDto;
import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@Tag(name = "Auditoria", description = "Trilha de eventos de segurança")
public class AuditoriaController {

    private final EventoSegurancaService service;

    public AuditoriaController(EventoSegurancaService service) {
        this.service = service;
    }

    @GetMapping("/eventos")
    @PreAuthorize("hasAuthority('AUDITORIA_LER')")
    @Operation(summary = "Lista eventos de segurança do contratante (mais recentes primeiro)")
    public PaginaDto<EventoSegurancaResponseDto> listar(
            @RequestParam(required = false) TipoEventoSeguranca tipo,
            @RequestParam(required = false) UUID usuarioId,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listar(tipo, usuarioId, pageable);
    }
}
