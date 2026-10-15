package com.api.ero_erp.catalogo.dtos;

import java.util.UUID;

/** Item de catálogo para combo. Mesma forma dos demais {@code SelectDto}. */
public record CatalogoSelectDto(UUID id, String nome) {}
