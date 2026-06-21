package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.otorrino.enums.CurvaJerger;
import com.api.ero_erp.otorrino.enums.ResultadoReflexo;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "imitanciometria")
@Getter
@Setter
@NoArgsConstructor
public class Imitanciometria extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id")
    private Consulta consulta;

    @Column(name = "data_exame", nullable = false)
    private LocalDate dataExame;

    // ── Curva timpanométrica (Jerger) ───────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "curva_od", length = 2)
    private CurvaJerger curvaOd;

    @Enumerated(EnumType.STRING)
    @Column(name = "curva_oe", length = 2)
    private CurvaJerger curvaOe;

    // ── Pico de pressão (daPa) ──────────────────────────────────────────────
    @Column(name = "pico_pressao_od_dapa")
    private Integer picoPressaoOdDapa;

    @Column(name = "pico_pressao_oe_dapa")
    private Integer picoPressaoOeDapa;

    // ── Complacência / admitância de pico (ml) ──────────────────────────────
    @Column(name = "complacencia_od_ml", precision = 10, scale = 2)
    private BigDecimal complacenciaOdMl;

    @Column(name = "complacencia_oe_ml", precision = 10, scale = 2)
    private BigDecimal complacenciaOeMl;

    // ── Volume do conduto auditivo externo (ml) ─────────────────────────────
    @Column(name = "volume_canal_od_ml", precision = 10, scale = 2)
    private BigDecimal volumeCanalOdMl;

    @Column(name = "volume_canal_oe_ml", precision = 10, scale = 2)
    private BigDecimal volumeCanalOeMl;

    // ── Reflexo estapédico ──────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "reflexo_ipsi_od", length = 15)
    private ResultadoReflexo reflexoIpsiOd;

    @Enumerated(EnumType.STRING)
    @Column(name = "reflexo_contra_od", length = 15)
    private ResultadoReflexo reflexoContraOd;

    @Enumerated(EnumType.STRING)
    @Column(name = "reflexo_ipsi_oe", length = 15)
    private ResultadoReflexo reflexoIpsiOe;

    @Enumerated(EnumType.STRING)
    @Column(name = "reflexo_contra_oe", length = 15)
    private ResultadoReflexo reflexoContraOe;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
