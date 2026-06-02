package com.api.ero_erp.cest.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.ncm.entity.Ncm;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cest")
@Getter
@Setter
@NoArgsConstructor
public class Cest extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 9)
    private String codigo;

    @Column(name = "descricao", nullable = false, length = 150)
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ncm_id", nullable = false)
    private Ncm ncm;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
