package com.api.ero_erp.documento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.estoque.entity.Estoque;
import com.api.ero_erp.financeiro.formapagamento.entity.FormaPagamento;
import com.api.ero_erp.modelodocumento.entity.ModeloDocumento;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "documento")
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Documento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modelo_documento_id", nullable = false)
    private ModeloDocumento modeloDocumento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "emitente_id", nullable = false)
    private Emitente emitente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_pessoa_id", nullable = false)
    private Pessoa clientePessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estoque_id")
    private Estoque estoque;

    @Column(name = "data_emissao", nullable = false)
    private LocalDate dataEmissao;

    @Column(name = "valor", precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "desconto", precision = 15, scale = 2)
    private BigDecimal desconto;

    @Column(name = "acrescimo", precision = 15, scale = 2)
    private BigDecimal acrescimo;

    @Column(name = "valor_final", precision = 15, scale = 2)
    private BigDecimal valorFinal;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_desconto", nullable = false, length = 10)
    private TipoAjuste tipoDesconto = TipoAjuste.VALOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_acrescimo", nullable = false, length = 10)
    private TipoAjuste tipoAcrescimo = TipoAjuste.VALOR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forma_pagamento_id")
    private FormaPagamento formaPagamento;

    @Column(name = "numero_parcelas")
    private Integer numeroParcelas;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DocumentoStatus status;

    @Column(name = "conteudo_gerado", columnDefinition = "TEXT")
    private String conteudoGerado;

    @Column(name = "observacoes", length = 1000)
    private String observacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.desconto       == null) this.desconto       = BigDecimal.ZERO;
        if (this.acrescimo      == null) this.acrescimo      = BigDecimal.ZERO;
        if (this.numeroParcelas == null) this.numeroParcelas = 1;
        if (this.status         == null) this.status         = DocumentoStatus.RASCUNHO;
        if (this.tipoDesconto   == null) this.tipoDesconto   = TipoAjuste.VALOR;
        if (this.tipoAcrescimo  == null) this.tipoAcrescimo  = TipoAjuste.VALOR;
    }
}
