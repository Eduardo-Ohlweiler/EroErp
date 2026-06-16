package com.api.ero_erp.pediatria.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "formula_lactea")
@Getter
@Setter
@NoArgsConstructor
public class FormulaLactea extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "kcal_por_100ml", nullable = false, precision = 10, scale = 2)
    private BigDecimal kcalPor100ml;

    @Column(name = "proteina_por_100ml", nullable = false, precision = 10, scale = 2)
    private BigDecimal proteinaPor100ml;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
