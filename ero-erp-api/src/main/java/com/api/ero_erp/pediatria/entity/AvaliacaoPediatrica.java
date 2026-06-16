package com.api.ero_erp.pediatria.entity;

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
@Table(name = "avaliacao_pediatrica")
@Getter
@Setter
@NoArgsConstructor
public class AvaliacaoPediatrica extends BaseEntity {

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

    @Column(name = "sexo", nullable = false, length = 1)
    private String sexo;

    @Column(name = "idade_meses", nullable = false)
    private Integer idadeMeses;

    @Column(name = "idade_semanas")
    private Integer idadeSemanas;

    @Column(name = "peso", nullable = false, precision = 5, scale = 2)
    private BigDecimal peso;

    @Column(name = "estatura", precision = 5, scale = 2)
    private BigDecimal estatura;

    // ── Dieta / fórmula láctea (snapshot) ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formula_lactea_id")
    private FormulaLactea formulaLactea;

    @Column(name = "formula_nome", length = 255)
    private String formulaNome;

    @Column(name = "formula_kcal_por_100ml", precision = 10, scale = 2)
    private BigDecimal formulaKcalPor100ml;

    @Column(name = "formula_proteina_por_100ml", precision = 10, scale = 2)
    private BigDecimal formulaProteinaPor100ml;

    @Column(name = "volume_ml", precision = 10, scale = 2)
    private BigDecimal volumeMl;

    @Column(name = "frequencia_horas", precision = 10, scale = 2)
    private BigDecimal frequenciaHoras;

    // ── Resultados (snapshot) ───────────────────────────────────────────────
    @Column(name = "imc", precision = 5, scale = 2)
    private BigDecimal imc;

    @Column(name = "classif_peso_idade", length = 50)
    private String classifPesoIdade;

    @Column(name = "classif_estatura_idade", length = 50)
    private String classifEstaturaIdade;

    @Column(name = "classif_imc_idade", length = 50)
    private String classifImcIdade;

    @Column(name = "vet", precision = 10, scale = 2)
    private BigDecimal vet;

    @Column(name = "proteina_necessidade", precision = 10, scale = 2)
    private BigDecimal proteinaNecessidade;

    @Column(name = "vezes_dia", precision = 10, scale = 2)
    private BigDecimal vezesDia;

    @Column(name = "volume_total", precision = 10, scale = 2)
    private BigDecimal volumeTotal;

    @Column(name = "calorias_totais", precision = 10, scale = 2)
    private BigDecimal caloriasTotais;

    @Column(name = "proteina_total", precision = 10, scale = 2)
    private BigDecimal proteinaTotal;

    @Column(name = "perc_calorico", precision = 10, scale = 2)
    private BigDecimal percCalorico;

    @Column(name = "perc_proteico", precision = 10, scale = 2)
    private BigDecimal percProteico;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
