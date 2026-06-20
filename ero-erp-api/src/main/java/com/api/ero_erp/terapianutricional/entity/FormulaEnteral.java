package com.api.ero_erp.terapianutricional.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "formula_enteral")
@Getter
@Setter
@NoArgsConstructor
public class FormulaEnteral extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "densidade_kcal_ml", nullable = false, precision = 10, scale = 2)
    private BigDecimal densidadeKcalMl;

    @Column(name = "proteina_g_l", nullable = false, precision = 10, scale = 2)
    private BigDecimal proteinaGL;

    @Column(name = "categoria", length = 50)
    private String categoria;

    @Column(name = "cho", precision = 10, scale = 2)
    private BigDecimal cho;

    @Column(name = "lip", precision = 10, scale = 2)
    private BigDecimal lip;

    @Column(name = "fibras", precision = 10, scale = 2)
    private BigDecimal fibras;

    @Column(name = "potassio", precision = 10, scale = 2)
    private BigDecimal potassio;

    @Column(name = "osmolaridade", precision = 10, scale = 2)
    private BigDecimal osmolaridade;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
