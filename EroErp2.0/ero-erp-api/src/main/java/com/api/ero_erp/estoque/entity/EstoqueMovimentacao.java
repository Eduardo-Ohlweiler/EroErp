package com.api.ero_erp.estoque.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.estoque.enums.TipoMovimentacao;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Uma linha do histórico do estoque. Imutável: nasce e não muda.
 *
 * <p>A quantidade é <b>com sinal</b> — entrada positiva, saída negativa — e
 * {@code posterior = anterior + quantidade}, travado por CHECK na migration.
 */
@Entity
@Table(name = "estoque_movimentacao")
@Getter
@Setter
@NoArgsConstructor
public class EstoqueMovimentacao extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_id", nullable = false, updatable = false)
    private Estoque estoque;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30, updatable = false)
    private TipoMovimentacao tipo;

    @Column(name = "quantidade", nullable = false, precision = 15, scale = 3, updatable = false)
    private BigDecimal quantidade;

    @Column(name = "quantidade_anterior", nullable = false, precision = 15, scale = 3, updatable = false)
    private BigDecimal quantidadeAnterior;

    @Column(name = "quantidade_posterior", nullable = false, precision = 15, scale = 3, updatable = false)
    private BigDecimal quantidadePosterior;

    @Column(name = "motivo", length = 255, updatable = false)
    private String motivo;

    /** O mesmo nos dois movimentos de uma transferência. */
    @Column(name = "transferencia_id", updatable = false)
    private UUID transferenciaId;

    /** Na transferência, a filial do outro lado. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filial_contraparte_id", updatable = false)
    private Filial filialContraparte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", updatable = false)
    private Usuario createdBy;
}
