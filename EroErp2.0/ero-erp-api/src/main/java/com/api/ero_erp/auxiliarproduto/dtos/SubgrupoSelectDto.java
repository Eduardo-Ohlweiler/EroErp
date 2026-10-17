package com.api.ero_erp.auxiliarproduto.dtos;

import java.util.UUID;

/** Item de combo: a tela mostra "Grupo — Subgrupo". */
public record SubgrupoSelectDto(UUID id, String nome, UUID grupoId, String grupoNome) {}
