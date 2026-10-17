package com.api.ero_erp.estoque.mapper;

import com.api.ero_erp.estoque.dtos.EstoqueMovimentavelDto;
import com.api.ero_erp.estoque.dtos.EstoqueResponseDto;
import com.api.ero_erp.estoque.dtos.MovimentacaoResponseDto;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.produto.entity.Produto;

public final class EstoqueMapper {

    private EstoqueMapper() {}

    public static EstoqueResponseDto toResponse(Estoque e) {
        Produto produto = e.getProduto();
        Filial filial = e.getFilial();
        return new EstoqueResponseDto(
                e.getId(),
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getAtivo(),
                produto.getUnidadeMedida().getSigla(),
                filial.getId(),
                filial.getPessoa().getNome(),
                filial.getCor(),
                filial.getAtivo(),
                e.getQuantidade(),
                e.getPrecoVenda(),
                e.getControlaEstoque(),
                e.getQuantidadeMinima(),
                e.getAtivo(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    public static EstoqueMovimentavelDto toMovimentavel(Estoque e) {
        Produto produto = e.getProduto();
        return new EstoqueMovimentavelDto(
                e.getId(),
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getUnidadeMedida().getSigla(),
                e.getQuantidade());
    }

    public static MovimentacaoResponseDto toResponse(EstoqueMovimentacao m) {
        Estoque estoque = m.getEstoque();
        Produto produto = estoque.getProduto();
        Filial filial = estoque.getFilial();
        Filial contraparte = m.getFilialContraparte();
        return new MovimentacaoResponseDto(
                m.getId(),
                estoque.getId(),
                m.getTipo(),
                m.getQuantidade(),
                m.getQuantidadeAnterior(),
                m.getQuantidadePosterior(),
                m.getMotivo(),
                m.getTransferenciaId(),
                produto.getId(),
                produto.getCodigo(),
                produto.getNome(),
                produto.getUnidadeMedida().getSigla(),
                filial.getId(),
                filial.getPessoa().getNome(),
                filial.getCor(),
                contraparte != null ? contraparte.getId() : null,
                contraparte != null ? contraparte.getPessoa().getNome() : null,
                m.getCreatedBy() != null ? m.getCreatedBy().getNome() : null,
                m.getCreatedAt());
    }
}
