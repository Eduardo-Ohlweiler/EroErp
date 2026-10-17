package com.api.ero_erp.filial.dtos;

import com.api.ero_erp.filial.enums.TipoFilial;
import com.api.ero_erp.pessoa.enums.TipoPessoa;

import java.time.Instant;
import java.util.UUID;

/**
 * @param documento CPF ou CNPJ da pessoa, só dígitos — a tela formata
 */
public record FilialResponseDto(
        UUID id,
        UUID pessoaId,
        String pessoaNome,
        String nomeFantasia,
        TipoPessoa tipoPessoa,
        String documento,
        TipoFilial tipo,
        UUID matrizId,
        String matrizNome,
        String cor,
        Boolean ativo,
        Instant createdAt,
        Instant updatedAt
) {}
