package com.api.ero_erp.consulta.controller;

import com.api.ero_erp.compromisso.dtos.CancelarCompromissoDto;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.consulta.dtos.ConsultaCalculoDto;
import com.api.ero_erp.consulta.dtos.ConsultaCalculoRequestDto;
import com.api.ero_erp.consulta.dtos.ConsultaCreateDto;
import com.api.ero_erp.consulta.dtos.ConsultaListaDto;
import com.api.ero_erp.consulta.dtos.ConsultaResponseDto;
import com.api.ero_erp.consulta.dtos.ConsultaUpdateDto;
import com.api.ero_erp.consulta.dtos.PrecoSugeridoDto;
import com.api.ero_erp.consulta.dtos.ReconsultaDto;
import com.api.ero_erp.consulta.service.ConsultaService;
import com.api.ero_erp.produto.dtos.ProdutoSelectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
 * Consulta — tela {@code CONSULTAS}: leitura nos GET, na prévia dos totais e
 * no preço sugerido; escrita no resto. Os itens dependem também de Serviços e
 * de Produtos (leitura), que o service confere. Ver docs/12 §7.
 *
 * <p>As rotas literais ({@code /calculo}, {@code /preco}, {@code /produtos})
 * convivem com {@code /{id}} porque o Spring prefere o literal.
 */
@RestController
@RequestMapping("/consultas")
@RequiredArgsConstructor
@Tag(name = "Consulta")
public class ConsultaController {

    private final ConsultaService consultaService;

    @GetMapping
    @PreAuthorize("hasAuthority('CONSULTAS_LER')")
    @Operation(summary = "Consultas do tenant, da mais recente para a mais antiga",
            description = "Filtros sobre o compromisso. `de` inclusivo e `ate` exclusivo, no início do horário.")
    public ResponseEntity<Page<ConsultaListaDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) UUID filialId,
            @RequestParam(required = false) UUID responsavelId,
            @RequestParam(required = false) UUID pessoaId,
            @RequestParam(required = false) StatusCompromisso status,
            @RequestParam(required = false) Instant de,
            @RequestParam(required = false) Instant ate) {
        return ResponseEntity.ok(consultaService.getAll(pageable, filialId, responsavelId, pessoaId, status, de, ate));
    }

    @PostMapping("/calculo")
    @PreAuthorize("hasAuthority('CONSULTAS_LER')")
    @Operation(summary = "Os totais de uma consulta em montagem, sem gravar",
            description = "As mesmas guardas do salvar: o 400 nomeia o item.")
    public ResponseEntity<ConsultaCalculoDto> calculo(@Valid @RequestBody ConsultaCalculoRequestDto dto) {
        return ResponseEntity.ok(consultaService.calculo(dto));
    }

    @GetMapping("/preco")
    @PreAuthorize("hasAuthority('CONSULTAS_LER')")
    @Operation(summary = "O preço que a filial sugere para um serviço ou um produto",
            description = "Ausente quando a filial não tem preço. Do produto, também o saldo.")
    public ResponseEntity<PrecoSugeridoDto> preco(@RequestParam UUID filialId,
                                                  @RequestParam(required = false) UUID servicoId,
                                                  @RequestParam(required = false) UUID produtoId) {
        return ResponseEntity.ok(consultaService.preco(filialId, servicoId, produtoId));
    }

    @GetMapping("/produtos")
    @PreAuthorize("hasAuthority('CONSULTAS_LER')")
    @Operation(summary = "Os produtos com estoque ativo numa filial, para o combo da consulta")
    public ResponseEntity<List<ProdutoSelectDto>> produtos(@RequestParam UUID filialId,
                                                           @RequestParam(required = false) String termo) {
        return ResponseEntity.ok(consultaService.produtosDaFilial(filialId, termo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CONSULTAS_LER')")
    @Operation(summary = "Detalha uma consulta",
            description = "Sem leitura de Serviços (ou Produtos), a lista deles não vem; os totais vêm.")
    public ResponseEntity<ConsultaResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(consultaService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Abre uma consulta",
            description = "`compromissoId` converte um compromisso aberto; `compromisso` cria um junto.")
    public ResponseEntity<ConsultaResponseDto> create(@Valid @RequestBody ConsultaCreateDto dto) {
        ConsultaResponseDto criada = consultaService.create(dto);
        return ResponseEntity.created(URI.create("/consultas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Altera a consulta e o compromisso dela",
            description = "Lista de itens nula não mexe; enviada é o estado completo.")
    public ResponseEntity<ConsultaResponseDto> update(@PathVariable UUID id,
                                                      @Valid @RequestBody ConsultaUpdateDto dto) {
        return ResponseEntity.ok(consultaService.update(id, dto));
    }

    @PatchMapping("/{id}/iniciar")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Começa o atendimento")
    public ResponseEntity<ConsultaResponseDto> iniciar(@PathVariable UUID id) {
        return ResponseEntity.ok(consultaService.iniciar(id));
    }

    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Conclui a consulta e baixa o estoque dos produtos",
            description = """
                    Saldo insuficiente recusa com 409 e nada baixa. A frase nomeia o
                    produto só para quem lê Produtos; para os outros, é genérica.""")
    public ResponseEntity<ConsultaResponseDto> concluir(@PathVariable UUID id) {
        return ResponseEntity.ok(consultaService.concluir(id));
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Cancela a consulta (o compromisso dela)")
    public ResponseEntity<ConsultaResponseDto> cancelar(@PathVariable UUID id,
                                                        @Valid @RequestBody(required = false)
                                                        CancelarCompromissoDto dto) {
        return ResponseEntity.ok(consultaService.cancelar(id, dto));
    }

    @PatchMapping("/{id}/faltou")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Marca falta", description = "Só depois do horário de início.")
    public ResponseEntity<ConsultaResponseDto> faltou(@PathVariable UUID id) {
        return ResponseEntity.ok(consultaService.faltou(id));
    }

    @PostMapping("/{id}/reconsulta")
    @PreAuthorize("hasAuthority('CONSULTAS_ESCREVER')")
    @Operation(summary = "Agenda a reconsulta",
            description = "Mesma filial e cliente; serviços e produtos copiados sem ajuste, com o preço de hoje.")
    public ResponseEntity<ConsultaResponseDto> reconsulta(@PathVariable UUID id,
                                                          @Valid @RequestBody ReconsultaDto dto) {
        ConsultaResponseDto criada = consultaService.reconsulta(id, dto);
        return ResponseEntity.created(URI.create("/consultas/" + criada.id())).body(criada);
    }
}
