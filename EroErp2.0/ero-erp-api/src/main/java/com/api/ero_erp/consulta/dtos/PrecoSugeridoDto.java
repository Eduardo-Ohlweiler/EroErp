package com.api.ero_erp.consulta.dtos;

import java.math.BigDecimal;

/**
 * O que o catálogo da filial diz de um serviço ou produto.
 *
 * @param precoUnitario   ausente quando a filial não tem preço: vazio não é zero
 * @param controlaEstoque só produto
 * @param saldo           só produto que controla estoque
 * @param unidadeSigla    só produto
 */
public record PrecoSugeridoDto(
        BigDecimal precoUnitario,
        Boolean controlaEstoque,
        BigDecimal saldo,
        String unidadeSigla
) {}
