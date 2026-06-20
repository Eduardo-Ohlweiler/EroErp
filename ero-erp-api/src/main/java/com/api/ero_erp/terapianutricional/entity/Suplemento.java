package com.api.ero_erp.terapianutricional.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "suplemento")
@Getter
@Setter
@NoArgsConstructor
public class Suplemento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "qtd_g", precision = 10, scale = 2)
    private BigDecimal qtdG;

    @Column(name = "kcal", precision = 10, scale = 2)
    private BigDecimal kcal;

    @Column(name = "ptn", precision = 10, scale = 2)
    private BigDecimal ptn;

    @Column(name = "cho", precision = 10, scale = 2)
    private BigDecimal cho;

    @Column(name = "acucar", precision = 10, scale = 2)
    private BigDecimal acucar;

    @Column(name = "lip", precision = 10, scale = 2)
    private BigDecimal lip;

    @Column(name = "sodio", precision = 10, scale = 2)
    private BigDecimal sodio;

    @Column(name = "potassio", precision = 10, scale = 2)
    private BigDecimal potassio;

    @Column(name = "fosforo", precision = 10, scale = 2)
    private BigDecimal fosforo;

    @Column(name = "ferro", precision = 10, scale = 2)
    private BigDecimal ferro;

    @Column(name = "fibras", precision = 10, scale = 2)
    private BigDecimal fibras;

    @Column(name = "osmolaridade", precision = 10, scale = 2)
    private BigDecimal osmolaridade;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
