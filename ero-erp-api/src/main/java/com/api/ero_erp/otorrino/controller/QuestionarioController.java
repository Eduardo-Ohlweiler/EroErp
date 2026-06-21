package com.api.ero_erp.otorrino.controller;

import com.api.ero_erp.otorrino.dto.QuestionarioDetalheDto;
import com.api.ero_erp.otorrino.dto.QuestionarioSummaryDto;
import com.api.ero_erp.otorrino.service.QuestionarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/otorrino/questionarios")
@Tag(name = "Otorrino - Questionários", description = "Catálogo de questionários padronizados (THI, DHI, SNOT-22, Epworth, NOSE)")
public class QuestionarioController {

    private final QuestionarioService service;

    public QuestionarioController(QuestionarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Lista o catálogo de questionários ativos (globais + do cliente)")
    public List<QuestionarioSummaryDto> getCatalogo() {
        return service.getCatalogo();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'OTORRINO', 'OTORRINO_GET')")
    @Operation(summary = "Busca o questionário por ID com seus itens e opções")
    public ResponseEntity<QuestionarioDetalheDto> getDetalhe(@PathVariable Long id) {
        return ResponseEntity.ok(service.getDetalhe(id));
    }
}
