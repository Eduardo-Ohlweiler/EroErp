package com.api.ero_erp.estoque.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * O estoque de um produto numa filial — e o preço de venda dele ali. Ver
 * docs/11.
 *
 * <p>A quantidade só muda por movimentação ({@code EstoqueService}), com a
 * linha travada; o {@code @Version} recusa a gravação que leu uma versão
 * velha, inclusive a do cadastro, que não toca na quantidade mas reescreve a
 * linha.
 */
@Entity
@Table(name = "estoque")
@Getter
@Setter
@NoArgsConstructor
public class Estoque extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false, updatable = false)
    private Produto produto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filial_id", nullable = false, updatable = false)
    private Filial filial;

    @Column(name = "quantidade", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade = BigDecimal.ZERO;

    /** Opcional: {@code null} é "não informado", que não é o mesmo que zero. */
    @Column(name = "preco_venda", precision = 15, scale = 2)
    private BigDecimal precoVenda;

    /**
     * Sem controle, a linha vale pelo preço e pela situação: não se
     * movimenta e não aparece nas consultas de movimentação.
     */
    @Column(name = "controla_estoque", nullable = false)
    private Boolean controlaEstoque = true;

    /** Só guardado, por enquanto: o alerta virá com o painel. */
    @Column(name = "quantidade_minima", precision = 15, scale = 3)
    private BigDecimal quantidadeMinima;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Version
    @Column(name = "versao", nullable = false)
    private Long versao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;
}
