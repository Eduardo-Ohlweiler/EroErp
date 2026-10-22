package com.api.ero_erp.consulta.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.consulta.enums.TipoAjuste;
import com.api.ero_erp.consulta.enums.TipoCalculo;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * O que serviço e produto da consulta têm em comum: a descrição e o preço
 * como estavam ao entrar (o <b>retrato</b> — o catálogo de hoje não reescreve
 * a consulta de ontem), o ajuste do item e a ordem na tela.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class ConsultaItem extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consulta_id", nullable = false, updatable = false)
    private Consulta consulta;

    @Column(name = "descricao", nullable = false, length = 150)
    private String descricao;

    @Column(name = "preco_unitario", nullable = false, precision = 15, scale = 2)
    private BigDecimal precoUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ajuste", length = 20)
    private TipoAjuste tipoAjuste;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_calculo", length = 20)
    private TipoCalculo tipoCalculo;

    @Column(name = "valor_ajuste", precision = 15, scale = 2)
    private BigDecimal valorAjuste;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;

    /** A quantidade como número, para a conta: inteira no serviço, com casas no produto. */
    public abstract BigDecimal quantidadeDecimal();
}
