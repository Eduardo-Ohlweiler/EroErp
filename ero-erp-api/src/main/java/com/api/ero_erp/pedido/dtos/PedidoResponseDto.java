package com.api.ero_erp.pedido.dtos;

import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;
import com.api.ero_erp.pedido.enums.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponseDto(
        Long                          id,
        StatusPedido                  status,

        // Emitente
        Long                          emitenteId,
        String                        emitenteNome,
        String                        emitenteDocumento,

        // Pessoa (cliente ou fornecedor)
        Long                          pessoaId,
        String                        pessoaNome,
        String                        pessoaDocumento,

        // Tipo de pedido (define comportamento de estoque/financeiro)
        Long                          tipoPedidoId,
        String                        tipoPedidoNome,
        MovimentaEstoque              movimentaEstoque,
        GeraFinanceiro                geraFinanceiro,

        // Vendedor
        Long                          vendedorId,
        String                        vendedorNome,

        LocalDateTime                 dataPedido,
        LocalDateTime                 dataEntrega,

        String                        observacao,
        String                        motivoCancelamento,
        boolean                       faturado,
        Long                          contaId,

        // Itens
        List<PedidoProdutoResponseDto>  produtos,

        // Ajuste global
        String                        tipoAjusteGeral,
        String                        tipoCalculoGeral,
        BigDecimal                    valorAjusteGeral,

        // Auditoria
        LocalDateTime                 createdAt,
        String                        createdByNome,
        LocalDateTime                 updatedAt,
        String                        updatedByNome
) {}
