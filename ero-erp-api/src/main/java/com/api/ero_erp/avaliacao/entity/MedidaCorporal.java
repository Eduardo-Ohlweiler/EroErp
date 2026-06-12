package com.api.ero_erp.avaliacao.entity;

import com.api.ero_erp.avaliacao.enums.PontoMedicao;
import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "medida_corporal")
@Getter
@Setter
@NoArgsConstructor
public class MedidaCorporal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliacao_id", nullable = false)
    private AvaliacaoFisica avaliacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "ponto_medicao", nullable = false, length = 30)
    private PontoMedicao pontoMedicao;

    @Column(name = "valor_cm", nullable = false, precision = 5, scale = 2)
    private BigDecimal valorCm;
}
