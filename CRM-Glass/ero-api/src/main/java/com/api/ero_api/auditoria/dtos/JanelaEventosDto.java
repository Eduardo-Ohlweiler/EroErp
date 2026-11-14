package com.api.ero_api.auditoria.dtos;

import java.time.Instant;

/**
 * Eventos de um tipo numa janela de tempo: quantos e quando foi o mais antigo
 * ({@code primeiro} nulo se nenhum). Uso interno (limite de códigos de login por
 * hora); não sai pela API.
 */
public record JanelaEventosDto(long quantidade, Instant primeiro) {
}
