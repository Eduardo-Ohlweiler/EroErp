package com.api.ero_erp.auxiliarproduto.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grupo_produto")
@Getter
@Setter
@NoArgsConstructor
public class GrupoProduto extends AuxiliarProdutoEntity {}
