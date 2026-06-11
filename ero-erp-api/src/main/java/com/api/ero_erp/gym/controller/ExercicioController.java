package com.api.ero_erp.gym.controller;

import com.api.ero_erp.gym.dto.ExercicioCreateDto;
import com.api.ero_erp.gym.dto.ExercicioResponseDto;
import com.api.ero_erp.gym.dto.ExercicioSummaryDto;
import com.api.ero_erp.gym.service.ExercicioService;
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

import java.util.List;

@RestController
@RequestMapping("/exercicios")
@Tag(name = "Gym — Exercícios", description = "Cadastro de exercícios")
public class ExercicioController {

    private final ExercicioService exercicioService;

    public ExercicioController(ExercicioService exercicioService) {
        this.exercicioService = exercicioService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO', 'EXERCICIO_GET')")
    @Operation(summary = "Lista exercícios com paginação e filtro")
    public Page<ExercicioSummaryDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String nome
    ) {
        return exercicioService.getAll(pageable, nome);
    }

    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO', 'EXERCICIO_GET', 'PLANO_TREINO', 'PLANO_TREINO_GET')")
    @Operation(summary = "Lista exercícios ativos para selects")
    public List<ExercicioSummaryDto> findAtivos() {
        return exercicioService.findAtivos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO', 'EXERCICIO_GET')")
    @Operation(summary = "Busca exercício por ID")
    public ResponseEntity<ExercicioResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(exercicioService.findByIdResponse(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO')")
    @Operation(summary = "Cria novo exercício")
    public ResponseEntity<ExercicioResponseDto> create(@Valid @RequestBody ExercicioCreateDto dto) {
        return new ResponseEntity<>(exercicioService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO')")
    @Operation(summary = "Atualiza exercício")
    public ResponseEntity<ExercicioResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ExercicioCreateDto dto
    ) {
        return ResponseEntity.ok(exercicioService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'EXERCICIO')")
    @Operation(summary = "Remove exercício")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        exercicioService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
