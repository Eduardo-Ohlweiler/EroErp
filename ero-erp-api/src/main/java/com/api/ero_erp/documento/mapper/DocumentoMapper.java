package com.api.ero_erp.documento.mapper;

import com.api.ero_erp.documento.dtos.DocumentoResponseDto;
import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import org.springframework.stereotype.Component;

@Component
public class DocumentoMapper {

    public DocumentoResponseDto toDto(Documento d) {
        Estoque estoque = d.getEstoque();
        FormaPagamento formaPagamento = d.getFormaPagamento();

        return new DocumentoResponseDto(
                d.getId(),
                d.getCliente().getId(),

                d.getModeloDocumento().getId(),
                d.getModeloDocumento().getNome(),

                d.getEmitente().getId(),
                d.getEmitente().getPessoa().getNome(),

                d.getClientePessoa().getId(),
                d.getClientePessoa().getNome(),

                estoque != null ? estoque.getId() : null,
                estoque != null ? estoque.getProduto().getNome() : null,

                d.getDataEmissao(),
                d.getValor(),
                d.getDesconto(),
                d.getTipoDesconto(),
                d.getAcrescimo(),
                d.getTipoAcrescimo(),
                d.getValorFinal(),
                d.getNumeroParcelas(),

                formaPagamento != null ? formaPagamento.getId() : null,
                formaPagamento != null ? formaPagamento.getNome() : null,

                d.getStatus(),

                d.getConteudoGerado(),
                d.getObservacoes(),

                d.getCreatedBy() != null ? d.getCreatedBy().getNome() : null,
                d.getUpdatedBy() != null ? d.getUpdatedBy().getNome() : null,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
