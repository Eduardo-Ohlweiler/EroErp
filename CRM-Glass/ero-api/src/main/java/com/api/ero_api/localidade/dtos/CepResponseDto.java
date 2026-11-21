package com.api.ero_api.localidade.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Endereço achado pelo CEP, para pré-preencher a tela. O número e o complemento ficam
 * sempre com o usuário.
 */
@Schema(description = "Endereço de um CEP")
public record CepResponseDto(
        @Schema(description = "CEP, só os 8 dígitos", example = "01001000") String cep,
        @Schema(description = "Cidade do IBGE (nula se o código do IBGE não veio ou não está na base)") CidadeSelectDto cidade,
        @Schema(description = "Logradouro (nulo quando o CEP é da cidade inteira)", example = "Praça da Sé") String rua,
        @Schema(description = "Bairro (nulo quando não veio)", example = "Sé") String bairro,
        @Schema(description = "true = CEP único da cidade: rua e bairro ficam para o usuário preencher") boolean cepUnico) {
}
