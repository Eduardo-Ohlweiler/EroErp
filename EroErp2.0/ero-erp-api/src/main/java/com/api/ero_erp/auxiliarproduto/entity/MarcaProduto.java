package com.api.ero_erp.auxiliarproduto.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "marca_produto")
@Getter
@Setter
@NoArgsConstructor
public class MarcaProduto extends AuxiliarProdutoEntity {}
