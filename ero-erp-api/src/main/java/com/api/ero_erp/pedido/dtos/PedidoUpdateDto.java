package com.api.ero_erp.pedido.dtos;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PedidoUpdateDto(

        @NotNull(message = "Emitente é obrigatório")
        Long emitenteId,

        @NotNull(message = "Pessoa é obrigatória")
        Long pessoaId,

        @NotNull(message = "Tipo de pedido é obrigatório")
        Long tipoPedidoId,

        Long vendedorId,

        @NotNull(message = "Data do pedido é obrigatória")
        LocalDateTime dataPedido,

        LocalDateTime dataEntrega,

        String observacao,

        String     tipoAjusteGeral,
        String     tipoCalculoGeral,
        BigDecimal valorAjusteGeral
) {}
