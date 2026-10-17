package com.api.ero_erp.filial.dtos;

import com.api.ero_erp.filial.enums.TipoFilial;

import java.util.UUID;

/**
 * Item de combo. O documento desempata nomes parecidos; a cor é a mesma que
 * a filial mostra nas outras telas.
 */
public record FilialSelectDto(
        UUID id,
        String nome,
        String documento,
        TipoFilial tipo,
        String cor
) {}
