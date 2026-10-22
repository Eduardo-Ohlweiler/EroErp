package com.api.ero_erp.consulta.entity;

import com.api.ero_erp.servico.entity.Servico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "consulta_servico")
@Getter
@Setter
@NoArgsConstructor
public class ConsultaServico extends ConsultaItem {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(name = "quantidade", nullable = false)
    private Integer quantidade;

    @Override
    public BigDecimal quantidadeDecimal() {
        return BigDecimal.valueOf(quantidade);
    }
}
