package com.api.ero_erp.whatsapp.dtos;

import java.util.UUID;

/**
 * @param filialId nulo no modo TENANT; obrigatório no POR_FILIAL
 */
public record ConectarDto(UUID filialId) {}
