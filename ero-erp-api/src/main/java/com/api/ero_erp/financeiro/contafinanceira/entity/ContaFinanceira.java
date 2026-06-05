package com.api.ero_erp.financeiro.contafinanceira.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "conta_financeira")
@Getter
@Setter
@NoArgsConstructor
public class ContaFinanceira extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
