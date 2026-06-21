package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "questionario_opcao")
@Getter
@Setter
@NoArgsConstructor
public class QuestionarioOpcao extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "questionario_id", nullable = false)
    private Questionario questionario;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;

    @Column(name = "rotulo", nullable = false)
    private String rotulo;

    @Column(name = "valor", nullable = false)
    private Integer valor;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
