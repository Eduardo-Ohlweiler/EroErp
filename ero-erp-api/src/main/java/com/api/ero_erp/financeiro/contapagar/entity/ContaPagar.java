package com.api.ero_erp.financeiro.contapagar.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.financeiro.enums.StatusConta;
import com.api.ero_erp.pessoa.entity.Pessoa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conta_pagar")
@Getter
@Setter
@NoArgsConstructor
public class ContaPagar extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emitente_id")
    private Emitente emitente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "valor_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    private StatusConta status;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @OneToMany(mappedBy = "contaPagar", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("numeroParcela ASC")
    private List<ParcelaContaPagar> parcelas = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
        if (this.status == null) this.status = StatusConta.ABERTO;
    }
}
