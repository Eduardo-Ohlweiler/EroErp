package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param descricao     o retrato do nome, como estava ao entrar
 * @param precoUnitario o retrato do preço
 * @param ajuste        com sinal: desconto negativo, acréscimo positivo
 * @param total         {@code subtotal + ajuste}
 */
public record ConsultaServicoResponseDto(
        UUID id,
        UUID servicoId,
        Long servicoCodigo,
        String descricao,
        Integer quantidade,
        BigDecimal precoUnitario,
        TipoAjuste tipoAjuste,
        TipoCalculo tipoCalculo,
        BigDecimal valorAjuste,
        BigDecimal subtotal,
        BigDecimal ajuste,
        BigDecimal total
) {}
