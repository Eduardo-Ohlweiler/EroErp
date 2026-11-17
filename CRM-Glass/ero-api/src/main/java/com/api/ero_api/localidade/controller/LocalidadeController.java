package com.api.ero_api.localidade.controller;

import com.api.ero_api.localidade.dtos.CepResponseDto;
import com.api.ero_api.localidade.dtos.CidadeSelectDto;
import com.api.ero_api.localidade.service.LocalidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cidades do IBGE e consulta de CEP. São apoio de qualquer tela com endereço, por isso
 * abertas a todo usuário sem pendência ({@code ACESSO_LIBERADO}).
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Localidades", description = "Cidades do IBGE e consulta de CEP")
public class LocalidadeController {

    private final LocalidadeService service;

    public LocalidadeController(LocalidadeService service) {
        this.service = service;
    }

    @GetMapping("/cidades/selecao")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Cidades para combo (até 50, por nome, sem acento e sem caixa)")
    public List<CidadeSelectDto> selecaoCidades(
            @Parameter(description = "Parte do nome da cidade") @RequestParam(required = false)
            @Size(max = 100, message = "Busca muito longa") String busca,
            @Parameter(description = "Sigla da UF em maiúsculas (vazio = todas)") @RequestParam(required = false)
            @Pattern(regexp = "^([A-Z]{2})?$", message = "UF deve ter 2 letras maiúsculas") String uf) {
        return service.buscarCidadesParaSelecao(busca, uf);
    }

    @GetMapping("/cep/{cep}")
    @PreAuthorize("hasAuthority('ACESSO_LIBERADO')")
    @Operation(summary = "Endereço de um CEP (ViaCEP): rua, bairro e cidade do IBGE")
    public CepResponseDto consultarCep(
            @Parameter(description = "Só os 8 dígitos", example = "01001000") @PathVariable String cep) {
        return service.consultarCep(cep);
    }
}
