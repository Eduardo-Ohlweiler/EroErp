package com.api.ero_erp.avaliacao.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "composicao_corporal")
@Getter
@Setter
@NoArgsConstructor
public class ComposicaoCorporal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliacao_id", nullable = false, unique = true)
    private AvaliacaoFisica avaliacao;

    @Column(name = "percentual_gordura", precision = 5, scale = 2)
    private BigDecimal percentualGordura;

    @Column(name = "massa_muscular_kg", precision = 5, scale = 2)
    private BigDecimal massaMuscularKg;

    @Column(name = "massa_gorda_kg", precision = 5, scale = 2)
    private BigDecimal massaGordaKg;

    @Column(name = "massa_ossea_kg", precision = 5, scale = 2)
    private BigDecimal massaOsseaKg;

    @Column(name = "agua_corporal_percentual", precision = 5, scale = 2)
    private BigDecimal aguaCorporalPercentual;

    @Column(name = "metabolismo_basal")
    private Integer metabolismoBasal;

    @Column(name = "idade_metabolica")
    private Integer idadeMetabolica;
}
