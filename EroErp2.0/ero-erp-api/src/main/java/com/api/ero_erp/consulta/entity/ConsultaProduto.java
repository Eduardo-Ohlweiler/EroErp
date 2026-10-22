package com.api.ero_erp.consulta.entity;

import com.api.ero_erp.produto.entity.Produto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** O produto usado na consulta. A baixa do estoque acontece ao concluir, não ao entrar aqui. */
@Entity
@Table(name = "consulta_produto")
@Getter
@Setter
@NoArgsConstructor
public class ConsultaProduto extends ConsultaItem {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "quantidade", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade;

    @Override
    public BigDecimal quantidadeDecimal() {
        return quantidade;
    }
}
