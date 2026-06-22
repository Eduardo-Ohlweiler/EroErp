package com.api.ero_erp.pedido.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pedido.enums.GeraFinanceiro;
import com.api.ero_erp.pedido.enums.MovimentaEstoque;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipo_pedido")
@Getter
@Setter
@NoArgsConstructor
public class TipoPedido extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "movimenta_estoque", nullable = false, length = 10)
    private MovimentaEstoque movimentaEstoque = MovimentaEstoque.NENHUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "gera_financeiro", nullable = false, length = 15)
    private GeraFinanceiro geraFinanceiro = GeraFinanceiro.NENHUM;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        this.ativo = true;
        if (this.movimentaEstoque == null) this.movimentaEstoque = MovimentaEstoque.NENHUM;
        if (this.geraFinanceiro   == null) this.geraFinanceiro   = GeraFinanceiro.NENHUM;
    }
}
