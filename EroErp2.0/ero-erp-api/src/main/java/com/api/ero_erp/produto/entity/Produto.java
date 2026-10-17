package com.api.ero_erp.produto.entity;

import com.api.ero_erp.auxiliarproduto.entity.CategoriaProduto;
import com.api.ero_erp.auxiliarproduto.entity.MarcaProduto;
import com.api.ero_erp.auxiliarproduto.entity.SubgrupoProduto;
import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.catalogo.entity.UnidadeMedida;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
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

/**
 * Produto do tenant — sem parte fiscal. O preço de venda não mora aqui: é por
 * filial, no estoque. Ver docs/11.
 */
@Entity
@Table(name = "produto")
@Getter
@Setter
@NoArgsConstructor
public class Produto extends TenantEntity {

    /** Sequencial dentro do tenant, gerado pelo sistema; nunca muda. */
    @Column(name = "codigo", nullable = false, updatable = false)
    private Long codigo;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "descricao", length = 2000)
    private String descricao;

    /** GTIN de 8, 12, 13 ou 14 dígitos, com o verificador conferido. */
    @Column(name = "ean", length = 14)
    private String ean;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidade_medida_id", nullable = false)
    private UnidadeMedida unidadeMedida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subgrupo_id")
    private SubgrupoProduto subgrupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private CategoriaProduto categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id")
    private MarcaProduto marca;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id")
    private Pessoa fornecedor;

    /** Opcional: {@code null} é "não informado", que não é o mesmo que zero. */
    @Column(name = "custo", precision = 15, scale = 2)
    private BigDecimal custo;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;
}
