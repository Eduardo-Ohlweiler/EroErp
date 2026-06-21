package com.api.ero_erp.otorrino.dto;

/**
 * Body para vincular/desvincular uma audiometria a uma consulta.
 * {@code consultaId} nulo desvincula a audiometria da consulta.
 */
public record VincularConsultaDto(
        Long consultaId
) {
}
