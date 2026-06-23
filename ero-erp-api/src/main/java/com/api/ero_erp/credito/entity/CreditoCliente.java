package com.api.ero_erp.credito.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.credito.enums.TipoCredito;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Movimento na razão de crédito (haver) do cliente:
 * ENTRADA = crédito gerado (devolução de venda); USO = crédito consumido (faturamento).
 * Saldo da pessoa = Σ ENTRADA − Σ USO.
 */
@Entity
@Table(name = "credito_cliente")
@Getter
@Setter
@NoArgsConstructor
public class CreditoCliente extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 10)
    private TipoCredito tipo;

    @Column(name = "valor", nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "origem", length = 255)
    private String origem;

    @Column(name = "pedido_id")
    private Long pedidoId;

    @Column(name = "conta_receber_id")
    private Long contaReceberId;

    @Column(name = "data", nullable = false)
    private LocalDateTime data;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;
}
