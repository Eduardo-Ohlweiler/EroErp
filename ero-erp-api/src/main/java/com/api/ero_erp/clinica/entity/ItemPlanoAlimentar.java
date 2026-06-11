package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.clinica.enums.DiaSemana;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalTime;

@Entity
@Table(name = "item_plano_alimentar")
@Getter
@Setter
@NoArgsConstructor
public class ItemPlanoAlimentar extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plano_id", nullable = false)
    private PlanoAlimentar plano;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refeicao_id")
    private Refeicao refeicao;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana", nullable = false, length = 20)
    private DiaSemana diaSemana;

    @Column(name = "horario", nullable = false)
    private LocalTime horario;

    @Column(name = "quantidade", length = 100)
    private String quantidade;

    @Column(name = "peso", precision = 15, scale = 4)
    private BigDecimal peso;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;
}
