package com.api.ero_erp.cliente.controller;

import com.api.ero_erp.cliente.dtos.ClienteCreateDto;
import com.api.ero_erp.cliente.dtos.ClienteUpdateDto;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
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

@RestController
@RequestMapping("/clientes")
@Tag(name = "Clientes)", description = "Operações realcionadas a clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @Operation(summary = "Busca um cliente por id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente encontrado"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Cliente findById(@PathVariable Long id){
        return this.clienteService.findById(id);
    }

    @Operation(
            summary = "Lista todos os clientes",
            description = "Exemplo: /clientes?page=0&size=10"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public Page<Cliente> getAll(
            @PageableDefault(size = 50, sort = "nome")
            Pageable pageable
    ) {
        return clienteService.getAll(pageable);
    }

    @Operation(summary = "Cria um novo cliente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cliente criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Cliente> create(@Valid @RequestBody ClienteCreateDto dto) {
        Cliente cliente = clienteService.create(dto);
        return new ResponseEntity<>(cliente, HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza parcialmente um cliente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cliente atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Cliente não encontrado"),
            @ApiResponse(responseCode = "409", description = "Conflito de dados (duplicidade)")
    })
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN')")
    public ResponseEntity<Cliente> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody ClienteUpdateDto dto
    ) {
        Cliente cliente = clienteService.update(id, dto);
        return ResponseEntity.ok(cliente);
    }
}
