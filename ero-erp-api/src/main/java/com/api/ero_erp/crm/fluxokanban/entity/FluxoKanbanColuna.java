package com.api.ero_erp.crm.fluxokanban.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "crm_fluxo_kanban_coluna",
        uniqueConstraints = @UniqueConstraint(columnNames = {"cliente_id", "andamento_id"})
)
@Getter @Setter @NoArgsConstructor
public class FluxoKanbanColuna extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "andamento_id", nullable = false)
    private Andamento andamento;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}
