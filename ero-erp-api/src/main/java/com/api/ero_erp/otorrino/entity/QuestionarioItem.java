package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "questionario_item")
@Getter
@Setter
@NoArgsConstructor
public class QuestionarioItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "questionario_id", nullable = false)
    private Questionario questionario;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;

    @Column(name = "enunciado", nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(name = "dominio", length = 20)
    private String dominio;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
