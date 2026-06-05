package com.api.ero_erp.produto.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.categoria.entity.Categoria;
import com.api.ero_erp.cest.entity.Cest;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.marca.entity.Marca;
import com.api.ero_erp.ncm.entity.Ncm;
import com.api.ero_erp.origemproduto.entity.OrigemProduto;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.subgrupo.entity.Subgrupo;
import com.api.ero_erp.tipoproduto.entity.TipoProduto;
import com.api.ero_erp.unidademedida.entity.UnidadeMedida;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "produto")
@Getter
@Setter
@NoArgsConstructor
public class Produto extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "codigo")
    private Integer codigo;

    @Column(name = "codigo_ean", length = 14)
    private String codigoEan;

    @Column(name = "codigo_gtin", length = 14)
    private String codigoGtin;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "bloqueado", nullable = false)
    private Boolean bloqueado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_produto_id", nullable = false)
    private TipoProduto tipoProduto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subgrupo_id")
    private Subgrupo subgrupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marca_id")
    private Marca marca;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidade_medida_id", nullable = false)
    private UnidadeMedida unidadeMedida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_pessoa_id")
    private Pessoa fornecedorPessoa;

    @Column(name = "custo", precision = 15, scale = 2)
    private BigDecimal custo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ncm_id")
    private Ncm ncm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origem_produto_id")
    private OrigemProduto origemProduto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cest_id")
    private Cest cest;

    @Column(name = "substituicao_tributaria", nullable = false)
    private Boolean substituicaoTributaria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.bloqueado == null) this.bloqueado = false;
        if (this.custo == null) this.custo = BigDecimal.ZERO;
        if (this.substituicaoTributaria == null) this.substituicaoTributaria = false;
    }
}
