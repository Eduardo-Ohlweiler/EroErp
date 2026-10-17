package com.api.ero_erp.localidade.dtos;

import java.util.UUID;

/**
 * Endereço achado pelo CEP, com a cidade já resolvida para a tabela IBGE.
 *
 * @param cepUnico  CEP geral da cidade: rua e bairro não vêm, o usuário informa
 * @param cidadeId  nulo só se o município do provedor não existir na tabela —
 *                  então {@code motivo} diz o que faltou
 */
public record CepResponseDto(
        String cep,
        String logradouro,
        String bairro,
        UUID cidadeId,
        String cidadeNome,
        String estadoSigla,
        boolean cepUnico,
        String motivo
) {}
