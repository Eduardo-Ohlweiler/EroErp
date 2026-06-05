package com.api.ero_erp.estoque.mapper;

import com.api.ero_erp.estoque.dtos.EstoqueAlertaDto;
import com.api.ero_erp.estoque.dtos.EstoqueResponseDto;
import com.api.ero_erp.estoque.dtos.MovimentacaoResponseDto;
import com.api.ero_erp.estoque.dtos.TransferenciaResponseDto;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.estoque.entity.EstoqueMovimentacao;
import com.api.ero_erp.estoque.entity.EstoqueTransferencia;
import org.springframework.stereotype.Component;

@Component
public class EstoqueMapper {

    public EstoqueResponseDto toDto(Estoque e) {
        return new EstoqueResponseDto(
                e.getId(),
                e.getCliente().getId(),
                e.getEmitente().getId(),
                e.getEmitente().getPessoa().getNome(),
                e.getProduto().getId(),
                e.getProduto().getNome(),
                e.getProduto().getCodigo() != null ? String.valueOf(e.getProduto().getCodigo()) : null,
                e.getProduto().getUnidadeMedida().getSigla(),
                e.getQuantidade(),
                e.getQuantidadeMinima(),
                e.getPrecoVenda(),
                e.getCustoMedio(),
                e.getBloqueado(),
                e.getBaixarEstoque(),
                e.getCreatedBy() != null ? e.getCreatedBy().getNome() : null,
                e.getUpdatedBy() != null ? e.getUpdatedBy().getNome() : null,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public MovimentacaoResponseDto toMovDto(EstoqueMovimentacao m) {
        return new MovimentacaoResponseDto(
                m.getId(),
                m.getCliente().getId(),
                m.getEstoque().getId(),
                m.getEmitente().getId(),
                m.getEmitente().getPessoa().getNome(),
                m.getProduto().getId(),
                m.getProduto().getNome(),
                m.getTipo(),
                m.getQuantidade(),
                m.getQuantidadeAnterior(),
                m.getQuantidadePosterior(),
                m.getMotivo(),
                m.getTransferencia() != null ? m.getTransferencia().getId() : null,
                m.getCreatedBy() != null ? m.getCreatedBy().getNome() : null,
                m.getCreatedAt()
        );
    }

    public EstoqueAlertaDto toAlertaDto(Estoque e) {
        return new EstoqueAlertaDto(
                e.getId(),
                e.getEmitente().getId(),
                e.getEmitente().getPessoa().getNome(),
                e.getProduto().getId(),
                e.getProduto().getNome(),
                e.getProduto().getCodigo() != null ? String.valueOf(e.getProduto().getCodigo()) : null,
                e.getProduto().getUnidadeMedida().getSigla(),
                e.getQuantidade(),
                e.getQuantidadeMinima()
        );
    }

    public TransferenciaResponseDto toTransfDto(EstoqueTransferencia t) {
        return new TransferenciaResponseDto(
                t.getId(),
                t.getCliente().getId(),
                t.getProduto().getId(),
                t.getProduto().getNome(),
                t.getEmitenteOrigem().getId(),
                t.getEmitenteOrigem().getPessoa().getNome(),
                t.getEmitenteDestino().getId(),
                t.getEmitenteDestino().getPessoa().getNome(),
                t.getQuantidade(),
                t.getObservacao(),
                t.getCreatedBy() != null ? t.getCreatedBy().getNome() : null,
                t.getCreatedAt()
        );
    }
}
