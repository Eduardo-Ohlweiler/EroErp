package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "consulta_produto")
@Getter
@Setter
@NoArgsConstructor
public class ConsultaProduto extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consulta_id", nullable = false)
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "emitente_id", nullable = false)
    private Emitente emitente;

    @Column(name = "quantidade", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidade = BigDecimal.ONE;

    @Column(name = "preco_unitario", nullable = false, precision = 15, scale = 2)
    private BigDecimal precoUnitario = BigDecimal.ZERO;

    @Column(name = "tipo_ajuste", length = 10)
    private String tipoAjuste;

    @Column(name = "tipo_calculo", length = 10)
    private String tipoCalculo;

    @Column(name = "valor_ajuste", precision = 15, scale = 2)
    private BigDecimal valorAjuste;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;
}
