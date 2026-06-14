package com.api.ero_erp.modelodocumento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modelo_documento")
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class ModeloDocumento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "descricao", length = 500)
    private String descricao;

    @Column(name = "conteudo", nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}
