package com.api.ero_erp.pedido.mapper;

import com.api.ero_erp.pedido.dtos.PedidoProdutoResponseDto;
import com.api.ero_erp.pedido.dtos.PedidoResponseDto;
import com.api.ero_erp.pedido.entity.Pedido;
import com.api.ero_erp.pedido.entity.PedidoProduto;
import com.api.ero_erp.pessoa.entity.Pessoa;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public class PedidoMapper {

    private PedidoMapper() {}

    private static String resolverDoc(Pessoa p) {
        if (p == null) return null;
        if (p.getCpf() != null && !p.getCpf().isBlank()) return p.getCpf();
        return p.getCnpj();
    }

    public static PedidoResponseDto toDto(Pedido pedido, List<PedidoProduto> produtos) {
        return new PedidoResponseDto(
                pedido.getId(),
                pedido.getStatus(),
                pedido.getEmitente().getId(),
                pedido.getEmitente().getPessoa().getNome(),
                resolverDoc(pedido.getEmitente().getPessoa()),
                pedido.getPessoa().getId(),
                pedido.getPessoa().getNome(),
                resolverDoc(pedido.getPessoa()),
                pedido.getTipoPedido().getId(),
                pedido.getTipoPedido().getNome(),
                pedido.getTipoPedido().getMovimentaEstoque(),
                pedido.getTipoPedido().getGeraFinanceiro(),
                pedido.getVendedor() != null ? pedido.getVendedor().getId() : null,
                pedido.getVendedor() != null ? pedido.getVendedor().getNome() : null,
                pedido.getDataPedido(),
                pedido.getDataEntrega(),
                pedido.getObservacao(),
                pedido.getMotivoCancelamento(),
                pedido.getFaturado() != null && pedido.getFaturado(),
                pedido.getContaId(),
                produtos.stream().map(PedidoMapper::toProdutoDto).toList(),
                pedido.getTipoAjusteGeral(),
                pedido.getTipoCalculoGeral(),
                pedido.getValorAjusteGeral(),
                pedido.getCreatedAt(),
                pedido.getCreatedBy() != null ? pedido.getCreatedBy().getNome() : null,
                pedido.getUpdatedAt(),
                pedido.getUpdatedBy() != null ? pedido.getUpdatedBy().getNome() : null
        );
    }

    public static PedidoProdutoResponseDto toProdutoDto(PedidoProduto pp) {
        BigDecimal total = calcTotal(
                pp.getPrecoUnitario(), pp.getQuantidade(),
                pp.getTipoAjuste(), pp.getTipoCalculo(), pp.getValorAjuste()
        );
        return new PedidoProdutoResponseDto(
                pp.getId(),
                pp.getProduto().getId(),
                pp.getProduto().getNome(),
                pp.getEmitente().getId(),
                pp.getEmitente().getPessoa().getNome(),
                pp.getQuantidade(),
                pp.getPrecoUnitario(),
                pp.getTipoAjuste(),
                pp.getTipoCalculo(),
                pp.getValorAjuste(),
                total,
                pp.getCreatedAt()
        );
    }

    public static BigDecimal calcTotal(
            BigDecimal preco, BigDecimal qtd,
            String tipoAjuste, String tipoCalculo, BigDecimal valorAjuste
    ) {
        BigDecimal base = preco.multiply(qtd);
        if (tipoAjuste == null || valorAjuste == null || valorAjuste.compareTo(BigDecimal.ZERO) == 0)
            return base.setScale(2, RoundingMode.HALF_UP);
        BigDecimal ajuste = "PERCENTUAL".equalsIgnoreCase(tipoCalculo)
                ? base.multiply(valorAjuste).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : valorAjuste.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = "DESCONTO".equalsIgnoreCase(tipoAjuste)
                ? base.subtract(ajuste)
                : base.add(ajuste);
        return total.setScale(2, RoundingMode.HALF_UP);
    }
}
