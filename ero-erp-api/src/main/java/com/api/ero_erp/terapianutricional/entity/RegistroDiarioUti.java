package com.api.ero_erp.terapianutricional.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "registro_diario_uti")
@Getter
@Setter
@NoArgsConstructor
public class RegistroDiarioUti extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    // ── Ficha clínica diária ─────────────────────────────────────────────────
    @Column(name = "dieta", length = 255)
    private String dieta;

    @Column(name = "hgt", length = 255)
    private String hgt;

    @Column(name = "vm_o2", length = 255)
    private String vmO2;

    @Column(name = "pa", length = 50)
    private String pa;

    // ── Laboratório ──────────────────────────────────────────────────────────
    @Column(name = "mg", precision = 10, scale = 2)
    private BigDecimal mg;

    @Column(name = "k", precision = 10, scale = 2)
    private BigDecimal k;

    @Column(name = "na", precision = 10, scale = 2)
    private BigDecimal na;

    @Column(name = "lact", precision = 10, scale = 2)
    private BigDecimal lact;

    @Column(name = "pcr", precision = 10, scale = 2)
    private BigDecimal pcr;

    @Column(name = "ph", precision = 10, scale = 2)
    private BigDecimal ph;

    @Column(name = "pco2", precision = 10, scale = 2)
    private BigDecimal pco2;

    @Column(name = "hco3", precision = 10, scale = 2)
    private BigDecimal hco3;

    // ── Balanço / eliminações ────────────────────────────────────────────────
    @Column(name = "bh", precision = 10, scale = 2)
    private BigDecimal bh;

    @Column(name = "diurese", precision = 10, scale = 2)
    private BigDecimal diurese;

    @Column(name = "evacuacao", length = 100)
    private String evacuacao;

    // ── TNE prescrito x infundido ────────────────────────────────────────────
    @Column(name = "perc_recebido_ne", precision = 10, scale = 2)
    private BigDecimal percRecebidoNe;

    @Column(name = "vol_prescrito_24h", precision = 10, scale = 2)
    private BigDecimal volPrescrito24h;

    @Column(name = "vol_recebido_24h", precision = 10, scale = 2)
    private BigDecimal volRecebido24h;

    // ── Controle de ingestão oral (% por refeição) ───────────────────────────
    @Column(name = "cafe_manha", precision = 10, scale = 2)
    private BigDecimal cafeManha;

    @Column(name = "lanche_manha", precision = 10, scale = 2)
    private BigDecimal lancheManha;

    @Column(name = "almoco", precision = 10, scale = 2)
    private BigDecimal almoco;

    @Column(name = "lanche_tarde", precision = 10, scale = 2)
    private BigDecimal lancheTarde;

    @Column(name = "jantar", precision = 10, scale = 2)
    private BigDecimal jantar;

    @Column(name = "ceia", precision = 10, scale = 2)
    private BigDecimal ceia;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
