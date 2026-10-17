package com.api.ero_erp.localidade.controller;

import com.api.ero_erp.catalogo.dtos.CatalogoSelectDto;
import com.api.ero_erp.localidade.dtos.CepResponseDto;
import com.api.ero_erp.localidade.dtos.CidadeSelectDto;
import com.api.ero_erp.localidade.service.LocalidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Estados e municípios do IBGE — referência global, somente leitura, sem
 * filtro por tenant.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Localidades", description = "Estados e municípios do IBGE")
@PreAuthorize("isAuthenticated()")
public class LocalidadeController {

    private final LocalidadeService localidadeService;

    @GetMapping("/estados/select")
    @Operation(summary = "As 27 unidades federativas")
    public ResponseEntity<List<CatalogoSelectDto>> estados() {
        return ResponseEntity.ok(localidadeService.estados());
    }

    @GetMapping("/cidades/select")
    @Operation(summary = "Municípios, para combo",
            description = """
                    Busca no servidor, no máximo 100 por chamada — são mais de
                    cinco mil. `estadoId` restringe à UF, que é como se acha
                    município de nome repetido.""")
    public ResponseEntity<List<CidadeSelectDto>> cidades(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) UUID estadoId) {
        return ResponseEntity.ok(localidadeService.cidades(nome, estadoId));
    }

    @GetMapping("/cep/{cep}")
    @Operation(summary = "Endereço pelo CEP",
            description = """
                    Consulta o ViaCEP e devolve rua, bairro e a cidade já na
                    tabela do IBGE. Aceita com ou sem máscara. CEP único de
                    cidade volta com `cepUnico` e sem rua nem bairro. 400 se
                    não tiver 8 dígitos, 404 se não existir, 503 se o
                    provedor não responder.""")
    public ResponseEntity<CepResponseDto> cep(@PathVariable String cep) {
        return ResponseEntity.ok(localidadeService.consultarCep(cep));
    }
}
