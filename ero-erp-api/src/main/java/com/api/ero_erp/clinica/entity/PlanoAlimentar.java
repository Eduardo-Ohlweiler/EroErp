package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plano_alimentar")
@Getter
@Setter
@NoArgsConstructor
public class PlanoAlimentar extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emitente_id")
    private Emitente emitente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim")
    private LocalDate dataFim;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @OneToMany(mappedBy = "plano", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPlanoAlimentar> itens = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
        this.ativo = true;
    }
}
