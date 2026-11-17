package com.api.ero_api.localidade.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Resposta do ViaCEP ({@code GET https://viacep.com.br/ws/{cep}/json/}), só com o que o
 * CRM usa. Não sai da API: o {@code LocalidadeService} converte em {@link CepResponseDto}.
 *
 * @param erro {@code true} quando o CEP tem formato válido mas não existe
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepRespostaDto(
        String cep,
        String logradouro,
        String bairro,
        String localidade,
        String uf,
        String ibge,
        Boolean erro) {
}
