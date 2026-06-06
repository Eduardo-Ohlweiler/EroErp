package com.api.ero_erp.financeiro.transferencia.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.financeiro.contafinanceira.entity.ContaFinanceira;
import com.api.ero_erp.financeiro.lancamento.entity.LancamentoFinanceiro;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transferencia_entre_contas")
@Getter
@Setter
@NoArgsConstructor
public class TransferenciaEntreContas extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conta_origem_id", nullable = false)
    private ContaFinanceira contaOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conta_destino_id", nullable = false)
    private ContaFinanceira contaDestino;

    @Column(name = "valor", nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lancamento_saida_id")
    private LancamentoFinanceiro lancamentoSaida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lancamento_entrada_id")
    private LancamentoFinanceiro lancamentoEntrada;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
