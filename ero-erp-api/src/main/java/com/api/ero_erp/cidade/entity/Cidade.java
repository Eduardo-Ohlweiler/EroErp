package com.api.ero_erp.cidade.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.estado.entity.Estado;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cidade")
@Getter
@Setter
@NoArgsConstructor
public class Cidade extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estado_id", nullable = false)
    private Estado estado;

    @Column(name = "codigo_ibge")
    private Integer codigoIbge;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}