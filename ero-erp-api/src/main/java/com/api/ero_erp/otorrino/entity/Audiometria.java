package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.otorrino.enums.GrauPerdaAuditiva;
import com.api.ero_erp.otorrino.enums.TipoPerdaAuditiva;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audiometria")
@Getter
@Setter
@NoArgsConstructor
public class Audiometria extends BaseEntity {

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

    // ── Logoaudiometria (por orelha) ────────────────────────────────────────
    @Column(name = "srt_od_db")
    private Integer srtOdDb;

    @Column(name = "srt_oe_db")
    private Integer srtOeDb;

    @Column(name = "irf_od_perc", precision = 5, scale = 2)
    private BigDecimal irfOdPerc;

    @Column(name = "irf_oe_perc", precision = 5, scale = 2)
    private BigDecimal irfOePerc;

    // ── Resultados calculados (snapshot) ────────────────────────────────────
    @Column(name = "media_od", precision = 5, scale = 2)
    private BigDecimal mediaOd;

    @Column(name = "media_oe", precision = 5, scale = 2)
    private BigDecimal mediaOe;

    @Enumerated(EnumType.STRING)
    @Column(name = "grau_od", length = 30)
    private GrauPerdaAuditiva grauOd;

    @Enumerated(EnumType.STRING)
    @Column(name = "grau_oe", length = 30)
    private GrauPerdaAuditiva grauOe;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_perda_od", length = 30)
    private TipoPerdaAuditiva tipoPerdaOd;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_perda_oe", length = 30)
    private TipoPerdaAuditiva tipoPerdaOe;

    @Column(name = "norma", length = 10)
    private String norma;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @OneToMany(mappedBy = "audiometria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AudiometriaLimiar> limiares = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }

    /** Adiciona um limiar mantendo o back-reference consistente. */
    public void addLimiar(AudiometriaLimiar limiar) {
        limiar.setAudiometria(this);
        this.limiares.add(limiar);
    }

    /** Remove todos os limiares (orphanRemoval cuida da exclusão no banco). */
    public void clearLimiares() {
        this.limiares.clear();
    }
}
