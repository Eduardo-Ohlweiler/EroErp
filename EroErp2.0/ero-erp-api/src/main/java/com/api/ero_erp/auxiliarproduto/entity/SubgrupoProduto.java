package com.api.ero_erp.auxiliarproduto.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Subgrupo de um grupo. O nome é único dentro do grupo: "Diversos" pode
 * existir em Bebidas e em Limpeza. O produto aponta para o subgrupo, e o grupo
 * vem dele.
 */
@Entity
@Table(name = "subgrupo_produto")
@Getter
@Setter
@NoArgsConstructor
public class SubgrupoProduto extends AuxiliarProdutoEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private GrupoProduto grupo;
}
