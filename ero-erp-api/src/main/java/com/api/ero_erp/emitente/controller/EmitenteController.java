package com.api.ero_erp.emitente.controller;

import com.api.ero_erp.emitente.dtos.EmitenteCreateDto;
import com.api.ero_erp.emitente.dtos.EmitenteResponseDto;
import com.api.ero_erp.emitente.dtos.EmitenteUpdateDto;
import com.api.ero_erp.emitente.service.EmitenteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/emitentes")
@Tag(name = "Emitentes", description = "Gerenciamento de emitentes por cliente")
public class EmitenteController {

    private final EmitenteService emitenteService;

    public EmitenteController(EmitenteService emitenteService) {
        this.emitenteService = emitenteService;
    }

    @Operation(
            summary = "Lista emitentes com paginação e filtros",
            description = "Exemplo: /emitentes?page=0&size=10&nome=empresa&bloqueado=false"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE', 'EMITENTE_GET')")
    public Page<EmitenteResponseDto> getAll(
            @PageableDefault(size = 15, sort = "pessoa.nome") Pageable pageable,
            @RequestParam(required = false)                    Boolean  bloqueado,
            @RequestParam(required = false)                    String   nome
    ) {
        return emitenteService.getAll(pageable, bloqueado, nome);
    }

    @Operation(
            summary = "Lista emitentes ativos sem paginação (para selects)",
            description = "Exemplo: /emitentes/select"
    )
    @GetMapping("/select")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE', 'EMITENTE_GET')")
    public List<EmitenteResponseDto> select(
            @RequestParam(required = false) String nome
    ) {
        return emitenteService.select(nome);
    }

    @Operation(summary = "Busca emitente por id")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE', 'EMITENTE_GET')")
    public ResponseEntity<EmitenteResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(emitenteService.findByIdResponse(id));
    }

    @Operation(summary = "Cria um novo emitente")
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE')")
    public ResponseEntity<EmitenteResponseDto> create(@Valid @RequestBody EmitenteCreateDto dto) {
        return new ResponseEntity<>(emitenteService.create(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um emitente por completo")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE')")
    public ResponseEntity<EmitenteResponseDto> update(
            @PathVariable       Long             id,
            @Valid @RequestBody EmitenteUpdateDto dto
    ) {
        return ResponseEntity.ok(emitenteService.update(id, dto));
    }

    @Operation(summary = "Deleta um emitente")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EMITENTE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        emitenteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
