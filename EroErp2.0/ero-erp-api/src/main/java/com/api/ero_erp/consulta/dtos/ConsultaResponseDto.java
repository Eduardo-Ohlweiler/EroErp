package com.api.ero_erp.consulta.dtos;

import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A consulta com o compromisso dela — horário, filial, cliente, responsável
 * e a situação vêm de lá.
 *
 * @param servicos    ausente para quem não lê Serviços
 * @param produtos    ausente para quem não lê Produtos
 * @param ajusteGeral com sinal: desconto negativo, acréscimo positivo
 * @param total       {@code subtotal + ajusteGeral}; {@code subtotal} é a soma
 *                    dos totais dos itens
 */
public record ConsultaResponseDto(
        UUID id,
        CompromissoResponseDto compromisso,
        String observacao,
        TipoAjuste tipoAjusteGeral,
        TipoCalculo tipoCalculoGeral,
        BigDecimal valorAjusteGeral,
        UUID consultaOrigemId,
        List<ConsultaServicoResponseDto> servicos,
        List<ConsultaProdutoResponseDto> produtos,
        BigDecimal subtotalServicos,
        BigDecimal subtotalProdutos,
        BigDecimal subtotal,
        BigDecimal ajusteGeral,
        BigDecimal total,
        String criadoPorNome,
        Instant createdAt,
        Instant updatedAt
) {}
