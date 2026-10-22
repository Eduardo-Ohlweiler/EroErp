package com.api.ero_erp.consulta.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * O atendimento sobre um compromisso. Guarda só o que é do atendimento:
 * horário, filial, cliente, responsável, convidados e a <b>situação</b> moram
 * no compromisso, e duplicá-los aqui os faria divergir. Ver docs/12 §7.
 */
@Entity
@Table(name = "consulta")
@Getter
@Setter
@NoArgsConstructor
public class Consulta extends TenantEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compromisso_id", nullable = false, updatable = false, unique = true)
    private Compromisso compromisso;

    @Column(name = "observacao", length = 2000)
    private String observacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ajuste_geral", length = 20)
    private TipoAjuste tipoAjusteGeral;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_calculo_geral", length = 20)
    private TipoCalculo tipoCalculoGeral;

    @Column(name = "valor_ajuste_geral", precision = 15, scale = 2)
    private BigDecimal valorAjusteGeral;

    /** A consulta de onde esta saiu, numa reconsulta. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_origem_id", updatable = false)
    private Consulta consultaOrigem;

    /** O item não vive sem a consulta: grava e sai junto com ela. */
    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    @BatchSize(size = 50)
    private List<ConsultaServico> servicos = new ArrayList<>();

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    @BatchSize(size = 50)
    private List<ConsultaProduto> produtos = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;
}
