package com.api.ero_erp.compromisso.controller;

import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCreateDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.service.CompromissoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
import java.util.Map;

@RestController
@RequestMapping("/compromissos")
@Tag(name = "Compromisso", description = "Gerenciamento de agenda e compromissos")
public class CompromissoController {

    private final CompromissoService compromissoService;

    public CompromissoController(CompromissoService compromissoService) {
        this.compromissoService = compromissoService;
    }

    @Operation(
            summary     = "Eventos do calendário",
            description = "Retorna todos os compromissos no período informado (endpoint do calendário)"
    )
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"))
    @GetMapping("/calendario")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CompromissoCalendarioDto>> getCalendario(
            @Parameter(description = "Início do período", example = "2025-06-01T00:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @Parameter(description = "Fim do período",   example = "2025-06-30T23:59:59")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        return ResponseEntity.ok(compromissoService.getCalendario(inicio, fim));
    }

    @Operation(
            summary     = "Listar compromissos",
            description = "Retorna lista paginada de compromissos com filtros opcionais"
    )
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"))
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_GET')")
    public ResponseEntity<Page<CompromissoResponseDto>> getAll(
            @PageableDefault(size = 20, sort = "inicio") Pageable pageable,
            @Parameter(description = "Filtrar por título")
            @RequestParam(required = false) String titulo,
            @Parameter(description = "Filtrar por ID da pessoa")
            @RequestParam(required = false) Long pessoaId,
            @Parameter(description = "Filtrar por ID do usuário responsável")
            @RequestParam(required = false) Long usuarioId,
            @Parameter(description = "Filtrar cancelados: true | false")
            @RequestParam(required = false) Boolean cancelado,
            @Parameter(description = "Filtrar concluídos: true | false")
            @RequestParam(required = false) Boolean concluido,
            @Parameter(description = "Início do período (ISO 8601)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @Parameter(description = "Fim do período (ISO 8601)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        return ResponseEntity.ok(
                compromissoService.getAll(pageable, titulo, pessoaId, usuarioId,
                        cancelado, concluido, inicio, fim)
        );
    }

    @Operation(summary = "Buscar compromisso por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compromisso encontrado"),
            @ApiResponse(responseCode = "404", description = "Compromisso não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_GET')")
    public ResponseEntity<CompromissoResponseDto> findById(
            @Parameter(description = "ID do compromisso", example = "1")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(compromissoService.findByIdResponse(id));
    }

    @Operation(
            summary     = "Criar compromisso",
            description = "Cria um ou mais compromissos (série de recorrência). Retorna todos os criados."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Compromisso(s) criado(s) com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "409", description = "Conflito de horário")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_POST')")
    public ResponseEntity<List<CompromissoResponseDto>> create(
            @RequestBody @Valid CompromissoCreateDto dto
    ) {
        return new ResponseEntity<>(compromissoService.create(dto), HttpStatus.CREATED);
    }

    @Operation(
            summary     = "Atualizar compromisso",
            description = "Atualiza apenas o compromisso informado, sem propagar para a série"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compromisso atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou status não permite edição"),
            @ApiResponse(responseCode = "404", description = "Compromisso não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de horário")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_POST')")
    public ResponseEntity<CompromissoResponseDto> update(
            @Parameter(description = "ID do compromisso", example = "1")
            @PathVariable Long id,
            @RequestBody @Valid CompromissoUpdateDto dto
    ) {
        return ResponseEntity.ok(compromissoService.update(id, dto));
    }

    @Operation(summary = "Cancelar compromisso")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compromisso cancelado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Compromisso já cancelado ou concluído"),
            @ApiResponse(responseCode = "404", description = "Compromisso não encontrado")
    })
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_POST')")
    public ResponseEntity<CompromissoResponseDto> cancelar(
            @Parameter(description = "ID do compromisso", example = "1")
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String motivo = body != null ? body.get("motivo") : null;
        return ResponseEntity.ok(compromissoService.cancelar(id, motivo));
    }

    @Operation(summary = "Concluir compromisso")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compromisso concluído com sucesso"),
            @ApiResponse(responseCode = "400", description = "Compromisso cancelado ou já concluído"),
            @ApiResponse(responseCode = "404", description = "Compromisso não encontrado")
    })
    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_POST')")
    public ResponseEntity<CompromissoResponseDto> concluir(
            @Parameter(description = "ID do compromisso", example = "1")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(compromissoService.concluir(id));
    }

    @Operation(
            summary     = "Deletar compromisso",
            description = "Se for o pai da série (compromissoPaiId == id), deleta todos os filhos junto"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Compromisso não encontrado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'COMPROMISSO', 'COMPROMISSO_DELETE')")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID do compromisso", example = "1")
            @PathVariable Long id
    ) {
        compromissoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}