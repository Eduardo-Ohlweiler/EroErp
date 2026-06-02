package com.api.ero_erp.tipoproduto.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipo_produto")
@Getter
@Setter
@NoArgsConstructor
public class TipoProduto extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 50)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
