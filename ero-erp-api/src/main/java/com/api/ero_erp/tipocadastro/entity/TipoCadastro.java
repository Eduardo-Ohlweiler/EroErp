package com.api.ero_erp.tipocadastro.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipo_cadastro")
@Getter
@Setter
@NoArgsConstructor
public class TipoCadastro extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
