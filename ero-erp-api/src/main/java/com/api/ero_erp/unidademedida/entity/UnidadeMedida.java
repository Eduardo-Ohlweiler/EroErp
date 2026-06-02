package com.api.ero_erp.unidademedida.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "unidade_medida")
@Getter
@Setter
@NoArgsConstructor
public class UnidadeMedida extends BaseEntity {

    @Column(name = "sigla", nullable = false, length = 10)
    private String sigla;

    @Column(name = "descricao", nullable = false, length = 100)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
