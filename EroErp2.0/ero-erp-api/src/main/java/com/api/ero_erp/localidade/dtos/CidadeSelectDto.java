package com.api.ero_erp.localidade.dtos;

import java.util.UUID;

/**
 * Item de combo de cidade. Leva a UF junto porque nome de município se repete:
 * "Bom Jesus" existe em nove estados.
 */
public record CidadeSelectDto(UUID id, String nome, String estadoSigla) {}
