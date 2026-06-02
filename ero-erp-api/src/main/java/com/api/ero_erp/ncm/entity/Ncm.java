package com.api.ero_erp.ncm.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ncm")
@Getter
@Setter
@NoArgsConstructor
public class Ncm extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 8)
    private String codigo;

    @Column(name = "descricao", nullable = false, length = 150)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
