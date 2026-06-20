package com.api.ero_erp.terapianutricional.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacao_nutricional_uti")
@Getter
@Setter
@NoArgsConstructor
public class AvaliacaoNutricionalUti extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate dataAvaliacao;

    // ── Entradas antropometria ───────────────────────────────────────────────
    @Column(name = "sexo", length = 1)
    private String sexo;

    @Column(name = "raca", length = 10)
    private String raca;

    @Column(name = "idade")
    private Integer idade;

    @Column(name = "cb", precision = 10, scale = 2)
    private BigDecimal cb;

    @Column(name = "cp", precision = 10, scale = 2)
    private BigDecimal cp;

    @Column(name = "ca", precision = 10, scale = 2)
    private BigDecimal ca;

    @Column(name = "aj", precision = 10, scale = 2)
    private BigDecimal aj;

    @Column(name = "peso_atual", precision = 10, scale = 2)
    private BigDecimal pesoAtual;

    @Column(name = "peso_usual", precision = 10, scale = 2)
    private BigDecimal pesoUsual;

    @Column(name = "altura", precision = 10, scale = 2)
    private BigDecimal altura;

    // ── Resultados antropometria ─────────────────────────────────────────────
    @Column(name = "altura_estimada", precision = 10, scale = 2)
    private BigDecimal alturaEstimada;

    @Column(name = "peso_estimado_chumlea", precision = 10, scale = 2)
    private BigDecimal pesoEstimadoChumlea;

    @Column(name = "peso_estimado_jung", precision = 10, scale = 2)
    private BigDecimal pesoEstimadoJung;

    @Column(name = "peso_estimado_rabito", precision = 10, scale = 2)
    private BigDecimal pesoEstimadoRabito;

    @Column(name = "imc", precision = 10, scale = 2)
    private BigDecimal imc;

    @Column(name = "peso_ideal", precision = 10, scale = 2)
    private BigDecimal pesoIdeal;

    @Column(name = "peso_ideal_imc25", precision = 10, scale = 2)
    private BigDecimal pesoIdealImc25;

    @Column(name = "peso_ajustado", precision = 10, scale = 2)
    private BigDecimal pesoAjustado;

    @Column(name = "perc_perda_peso", precision = 10, scale = 2)
    private BigDecimal percPerdaPeso;

    @Column(name = "perc_adequacao_cb", precision = 10, scale = 2)
    private BigDecimal percAdequacaoCb;

    @Column(name = "classif_imc_oms", length = 50)
    private String classifImcOms;

    @Column(name = "classif_imc_opas", length = 50)
    private String classifImcOpas;

    @Column(name = "classif_perda_peso", length = 50)
    private String classifPerdaPeso;

    @Column(name = "classif_adequacao_cb", length = 50)
    private String classifAdequacaoCb;

    @Column(name = "classif_deplecao_cp", length = 50)
    private String classifDeplecaoCp;

    // ── Necessidades ─────────────────────────────────────────────────────────
    @Column(name = "fase", length = 20)
    private String fase;

    @Column(name = "kcal_kg_alvo", precision = 10, scale = 2)
    private BigDecimal kcalKgAlvo;

    @Column(name = "ptn_kg_alvo", precision = 10, scale = 2)
    private BigDecimal ptnKgAlvo;

    @Column(name = "kcal_min", precision = 10, scale = 2)
    private BigDecimal kcalMin;

    @Column(name = "kcal_max", precision = 10, scale = 2)
    private BigDecimal kcalMax;

    @Column(name = "ptn_min", precision = 10, scale = 2)
    private BigDecimal ptnMin;

    @Column(name = "ptn_max", precision = 10, scale = 2)
    private BigDecimal ptnMax;

    @Column(name = "kcal_total", precision = 10, scale = 2)
    private BigDecimal kcalTotal;

    @Column(name = "ptn_total", precision = 10, scale = 2)
    private BigDecimal ptnTotal;

    @Column(name = "ptn_hd_intermitente", precision = 10, scale = 2)
    private BigDecimal ptnHdIntermitente;

    @Column(name = "ptn_hd_continua", precision = 10, scale = 2)
    private BigDecimal ptnHdContinua;

    // ── Dieta enteral (snapshot) ─────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formula_enteral_id")
    private FormulaEnteral formulaEnteral;

    @Column(name = "formula_nome", length = 255)
    private String formulaNome;

    @Column(name = "formula_densidade_kcal_ml", precision = 10, scale = 2)
    private BigDecimal formulaDensidadeKcalMl;

    @Column(name = "formula_proteina_g_l", precision = 10, scale = 2)
    private BigDecimal formulaProteinaGL;

    @Column(name = "modo_dieta", length = 20)
    private String modoDieta;

    @Column(name = "volume_dieta", precision = 10, scale = 2)
    private BigDecimal volumeDieta;

    @Column(name = "tempo_dieta", precision = 10, scale = 2)
    private BigDecimal tempoDieta;

    @Column(name = "dieta_vt", precision = 10, scale = 2)
    private BigDecimal dietaVt;

    @Column(name = "dieta_kcal", precision = 10, scale = 2)
    private BigDecimal dietaKcal;

    @Column(name = "dieta_ptn", precision = 10, scale = 2)
    private BigDecimal dietaPtn;

    @Column(name = "dieta_kcal_kg", precision = 10, scale = 2)
    private BigDecimal dietaKcalKg;

    @Column(name = "dieta_ptn_kg", precision = 10, scale = 2)
    private BigDecimal dietaPtnKg;

    @Column(name = "dieta_perc_vct", precision = 10, scale = 2)
    private BigDecimal dietaPercVct;

    @Column(name = "dieta_perc_ptn", precision = 10, scale = 2)
    private BigDecimal dietaPercPtn;

    @Column(name = "dieta_volume_pleno", precision = 10, scale = 2)
    private BigDecimal dietaVolumePleno;

    // ── Hidratação ───────────────────────────────────────────────────────────
    @Column(name = "hidratacao_volume_dieta", precision = 10, scale = 2)
    private BigDecimal hidratacaoVolumeDieta;

    @Column(name = "hidratacao_nec_min", precision = 10, scale = 2)
    private BigDecimal hidratacaoNecMin;

    @Column(name = "hidratacao_nec_ideal", precision = 10, scale = 2)
    private BigDecimal hidratacaoNecIdeal;

    @Column(name = "hidratacao_agua_dieta", precision = 10, scale = 2)
    private BigDecimal hidratacaoAguaDieta;

    @Column(name = "hidratacao_agua_extra_min", precision = 10, scale = 2)
    private BigDecimal hidratacaoAguaExtraMin;

    @Column(name = "hidratacao_agua_extra_ideal", precision = 10, scale = 2)
    private BigDecimal hidratacaoAguaExtraIdeal;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
