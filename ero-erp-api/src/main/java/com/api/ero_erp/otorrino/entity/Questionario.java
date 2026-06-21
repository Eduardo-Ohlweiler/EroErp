package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.otorrino.enums.CodigoQuestionario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questionario")
@Getter
@Setter
@NoArgsConstructor
public class Questionario extends BaseEntity {

    /** NULL = questionário global do sistema. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    @Column(name = "codigo", nullable = false, length = 20)
    private CodigoQuestionario codigo;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "instrucao", columnDefinition = "TEXT")
    private String instrucao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    @OneToMany(mappedBy = "questionario")
    @OrderBy("ordem ASC")
    private List<QuestionarioItem> itens = new ArrayList<>();

    @OneToMany(mappedBy = "questionario")
    @OrderBy("ordem ASC")
    private List<QuestionarioOpcao> opcoes = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
