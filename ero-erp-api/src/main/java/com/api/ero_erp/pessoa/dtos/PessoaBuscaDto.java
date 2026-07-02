package com.api.ero_erp.pessoa.dtos;

import com.api.ero_erp.pessoa.enums.TipoPessoa;

/**
 * Projeção leve de Pessoa para telas de busca/seleção (ex.: vincular pessoa a um
 * atendimento do CRM). Inclui um telefone representativo para ajudar na identificação.
 */
public record PessoaBuscaDto(
        Long       id,
        String     nome,
        TipoPessoa tipoPessoa,
        String     cpf,
        String     cnpj,
        String     telefone
) {}
