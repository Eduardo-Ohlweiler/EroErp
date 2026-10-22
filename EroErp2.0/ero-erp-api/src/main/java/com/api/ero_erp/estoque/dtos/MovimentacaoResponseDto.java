package com.api.ero_erp.estoque.dtos;

import com.api.ero_erp.estoque.enums.TipoMovimentacao;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * @param quantidade com sinal: entrada positiva, saída negativa
 * @param consultaId na saída por consulta, a consulta que baixou
 * @param filialContraparteNome na transferência, a filial do outro lado
 * @param usuarioNome quem lançou
 */
public record MovimentacaoResponseDto(
        UUID id,
        UUID estoqueId,
        TipoMovimentacao tipo,
        BigDecimal quantidade,
        BigDecimal quantidadeAnterior,
        BigDecimal quantidadePosterior,
        String motivo,
        UUID transferenciaId,
        UUID consultaId,
        UUID produtoId,
        Long produtoCodigo,
        String produtoNome,
        String unidadeSigla,
        UUID filialId,
        String filialNome,
        String filialCor,
        UUID filialContraparteId,
        String filialContraparteNome,
        String usuarioNome,
        Instant createdAt
) {}
