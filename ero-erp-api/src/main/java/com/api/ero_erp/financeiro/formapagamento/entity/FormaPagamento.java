package com.api.ero_erp.financeiro.formapagamento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.tipocobranca.entity.TipoCobranca;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "forma_pagamento")
@Getter
@Setter
@NoArgsConstructor
public class FormaPagamento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_cobranca_id", nullable = false)
    private TipoCobranca tipoCobranca;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conta_financeira_id", nullable = false)
    private ContaFinanceira contaFinanceira;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
