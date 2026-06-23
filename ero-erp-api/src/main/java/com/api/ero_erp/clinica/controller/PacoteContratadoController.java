package com.api.ero_erp.clinica.controller;

import com.api.ero_erp.clinica.dtos.CancelarPacoteDto;
import com.api.ero_erp.clinica.dtos.ContratarPacoteDto;
import com.api.ero_erp.clinica.dtos.PacoteContratadoResponseDto;
import com.api.ero_erp.clinica.enums.StatusPacote;
import com.api.ero_erp.clinica.service.PacoteContratadoService;
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

@RestController
@RequestMapping("/pacotes")
@Tag(name = "Clínica — Pacotes de Sessões", description = "Pacotes pré-pagos de sessões (contratação e acompanhamento)")
public class PacoteContratadoController {

    private final PacoteContratadoService pacoteService;

    public PacoteContratadoController(PacoteContratadoService pacoteService) {
        this.pacoteService = pacoteService;
    }

    @Operation(summary = "Lista pacotes com paginação e filtros")
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public Page<PacoteContratadoResponseDto> getAll(
            @PageableDefault(size = 15) Pageable pageable,
            @RequestParam(required = false) Long         pessoaId,
            @RequestParam(required = false) StatusPacote status,
            @RequestParam(required = false) String       nome
    ) {
        return pacoteService.getAll(pageable, pessoaId, status, nome);
    }

    @Operation(summary = "Busca pacote por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA', 'CLINICA_GET')")
    public ResponseEntity<PacoteContratadoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(pacoteService.findByIdResponse(id));
    }

    @Operation(summary = "Contrata um pacote: gera as sessões na agenda (faturadas) e a conta a receber pré-paga")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<PacoteContratadoResponseDto> contratar(@Valid @RequestBody ContratarPacoteDto dto) {
        return new ResponseEntity<>(pacoteService.contratar(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Cancela o pacote e suas sessões agendadas/em atendimento (não altera a conta a receber)")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<PacoteContratadoResponseDto> cancelarPacote(
            @PathVariable Long id,
            @RequestBody(required = false) CancelarPacoteDto dto
    ) {
        return ResponseEntity.ok(pacoteService.cancelarPacote(id, dto != null ? dto.motivo() : null));
    }

    @Operation(summary = "Cancela uma sessão específica do pacote (não altera a conta a receber)")
    @PatchMapping("/{pacoteId}/sessoes/{consultaId}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CLINICA')")
    public ResponseEntity<PacoteContratadoResponseDto> cancelarSessao(
            @PathVariable Long pacoteId,
            @PathVariable Long consultaId,
            @RequestBody(required = false) CancelarPacoteDto dto
    ) {
        return ResponseEntity.ok(
                pacoteService.cancelarSessao(pacoteId, consultaId, dto != null ? dto.motivo() : null));
    }
}
