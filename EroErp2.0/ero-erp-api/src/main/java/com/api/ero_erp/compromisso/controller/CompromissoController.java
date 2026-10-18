package com.api.ero_erp.compromisso.controller;

import com.api.ero_erp.compromisso.dtos.CancelarCompromissoDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCreateDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeRequestDto;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeResponseDto;
import com.api.ero_erp.compromisso.service.CompromissoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
 * Agenda — tela {@code AGENDA}: leitura nos GET e na disponibilidade, escrita
 * no resto. ADMIN e SUPERADMIN têm as duas. Ver docs/12.
 */
@RestController
@RequestMapping("/compromissos")
@RequiredArgsConstructor
@Tag(name = "Agenda")
@PreAuthorize("isAuthenticated()")
public class CompromissoController {

    private final CompromissoService compromissoService;

    @GetMapping("/calendario")
    @PreAuthorize("hasAuthority('AGENDA_LER')")
    @Operation(summary = "Compromissos de uma janela do calendário",
            description = """
                    Até 62 dias por vez. `usuarioId` traz o que o usuário atende
                    ou para o que foi convidado. Inclui cancelados e faltas — a
                    tela decide como mostrá-los.""")
    public ResponseEntity<List<CompromissoCalendarioDto>> calendario(
            @RequestParam Instant inicio,
            @RequestParam Instant fim,
            @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) UUID usuarioId) {
        return ResponseEntity.ok(compromissoService.calendario(inicio, fim, filialId, usuarioId));
    }

    @PostMapping("/disponibilidade")
    @PreAuthorize("hasAuthority('AGENDA_LER')")
    @Operation(summary = "Quem já está ocupado nos horários do formulário",
            description = """
                    Não grava nada. Uma linha por ocorrência; o choque do
                    responsável impede salvar, o de convidado é só aviso.""")
    public ResponseEntity<DisponibilidadeResponseDto> disponibilidade(
            @Valid @RequestBody DisponibilidadeRequestDto dto) {
        return ResponseEntity.ok(compromissoService.disponibilidade(dto));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('AGENDA_LER')")
    @Operation(summary = "Detalha um compromisso")
    public ResponseEntity<CompromissoResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(compromissoService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Agenda um compromisso",
            description = "Com recorrência, cria todas as ocorrências de uma vez e devolve a lista.")
    public ResponseEntity<List<CompromissoResponseDto>> create(@Valid @RequestBody CompromissoCreateDto dto) {
        List<CompromissoResponseDto> criados = compromissoService.create(dto);
        return ResponseEntity.created(URI.create("/compromissos/" + criados.getFirst().id())).body(criados);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Altera um compromisso aberto",
            description = "Só esta ocorrência. Remarcar um confirmado o devolve a agendado.")
    public ResponseEntity<CompromissoResponseDto> update(@PathVariable UUID id,
                                                         @Valid @RequestBody CompromissoUpdateDto dto) {
        return ResponseEntity.ok(compromissoService.update(id, dto));
    }

    @PatchMapping("/{id}/confirmar")
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Marca o compromisso como confirmado")
    public ResponseEntity<CompromissoResponseDto> confirmar(@PathVariable UUID id) {
        return ResponseEntity.ok(compromissoService.confirmar(id));
    }

    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Conclui o compromisso")
    public ResponseEntity<CompromissoResponseDto> concluir(@PathVariable UUID id) {
        return ResponseEntity.ok(compromissoService.concluir(id));
    }

    @PatchMapping("/{id}/faltou")
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Marca falta", description = "Só depois do horário de início.")
    public ResponseEntity<CompromissoResponseDto> faltou(@PathVariable UUID id) {
        return ResponseEntity.ok(compromissoService.faltou(id));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAuthority('AGENDA_ESCREVER')")
    @Operation(summary = "Cancela o compromisso",
            description = "Numa série, `escopo=SEGUINTES` cancela também os seguintes ainda abertos.")
    public ResponseEntity<CompromissoResponseDto> cancelar(@PathVariable UUID id,
                                                           @Valid @RequestBody(required = false)
                                                           CancelarCompromissoDto dto) {
        return ResponseEntity.ok(compromissoService.cancelar(id, dto));
    }
}
