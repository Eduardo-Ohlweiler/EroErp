package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "questionario_resposta")
@Getter
@Setter
@NoArgsConstructor
public class QuestionarioResposta extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aplicado_id", nullable = false)
    private QuestionarioAplicado aplicado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private QuestionarioItem item;

    @Column(name = "valor", nullable = false)
    private Integer valor;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
