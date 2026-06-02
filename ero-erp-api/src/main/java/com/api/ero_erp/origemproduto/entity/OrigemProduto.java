package com.api.ero_erp.origemproduto.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "origem_produto")
@Getter
@Setter
@NoArgsConstructor
public class OrigemProduto extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 1)
    private String codigo;

    @Column(name = "descricao", nullable = false, length = 150)
    private String descricao;
}
