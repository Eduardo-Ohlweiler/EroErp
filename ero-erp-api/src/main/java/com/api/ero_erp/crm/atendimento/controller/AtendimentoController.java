package com.api.ero_erp.crm.atendimento.controller;

import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.crm.atendimento.dtos.AssumirAtendimentoDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoListaResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.AtendimentoResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.EnviarMensagemDto;
import com.api.ero_erp.crm.atendimento.dtos.MensagemResponseDto;
import com.api.ero_erp.crm.atendimento.dtos.MoverAndamentoDto;
import com.api.ero_erp.crm.atendimento.dtos.VincularPessoaDto;
import com.api.ero_erp.crm.atendimento.service.AtendimentoService;
import com.api.ero_erp.crm.sse.CrmSseService;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/crm/atendimentos")
public class AtendimentoController {

    private final AtendimentoService service;
    private final CrmSseService      sseService;
    private final SecurityUtils      securityUtils;

    public AtendimentoController(
            AtendimentoService service,
            CrmSseService      sseService,
            SecurityUtils      securityUtils
    ) {
        this.service       = service;
        this.sseService    = sseService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<AtendimentoResponseDto> listarKanban(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long andamentoId
    ) {
        return service.listarKanban(usuarioId, andamentoId);
    }

    @GetMapping("/lista")
    @PreAuthorize("isAuthenticated()")
    public Page<AtendimentoListaResponseDto> listar(
            @RequestParam(required = false) Long   andamentoId,
            @RequestParam(required = false) Long   usuarioId,
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return service.listarPaginado(andamentoId, usuarioId, busca, dataInicio, dataFim, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtendimentoResponseDto> getAtendimento(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAtendimento(id));
    }

    @PutMapping("/{id}/pessoa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtendimentoResponseDto> vincularPessoa(
            @PathVariable Long id,
            @Valid @RequestBody VincularPessoaDto dto
    ) {
        return ResponseEntity.ok(service.vincularPessoa(id, dto.pessoaId()));
    }

    @GetMapping("/{id}/mensagens")
    @PreAuthorize("isAuthenticated()")
    public Page<MensagemResponseDto> listarMensagens(
            @PathVariable Long id,
            @PageableDefault(size = 30, sort = "dataMensagem", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.listarMensagens(id, pageable);
    }

    @PostMapping("/{id}/mensagens")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MensagemResponseDto> enviarMensagem(
            @PathVariable Long id,
            @RequestBody EnviarMensagemDto dto
    ) {
        return ResponseEntity.ok(service.enviarMensagem(id, dto));
    }

    @PutMapping("/{id}/andamento")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtendimentoResponseDto> moverAndamento(
            @PathVariable Long id,
            @Valid @RequestBody MoverAndamentoDto dto
    ) {
        return ResponseEntity.ok(service.moverAndamento(id, dto.andamentoId()));
    }

    @PostMapping("/{id}/pegar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtendimentoResponseDto> pegar(@PathVariable Long id) {
        return ResponseEntity.ok(service.pegar(id));
    }

    @PostMapping("/{id}/assumir")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtendimentoResponseDto> assumir(
            @PathVariable Long id,
            @RequestBody(required = false) AssumirAtendimentoDto dto
    ) {
        return ResponseEntity.ok(service.assumir(id, dto));
    }

    @PutMapping("/{id}/ler")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> marcarLido(@PathVariable Long id) {
        service.marcarLido(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mensagens/{id}/midia")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ByteArrayResource> baixarMidia(@PathVariable Long id) {
        AtendimentoService.MidiaBaixada midia = service.baixarMidia(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(midia.mimetype()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(new ByteArrayResource(midia.bytes()));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return sseService.subscribe(clienteId);
    }
}
