package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.otorrino.enums.OrelhaEnum;
import com.api.ero_erp.otorrino.enums.ViaEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audiometria_limiar")
@Getter
@Setter
@NoArgsConstructor
public class AudiometriaLimiar extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "audiometria_id", nullable = false)
    private Audiometria audiometria;

    @Enumerated(EnumType.STRING)
    @Column(name = "orelha", nullable = false, length = 2)
    private OrelhaEnum orelha;

    @Enumerated(EnumType.STRING)
    @Column(name = "via", nullable = false, length = 10)
    private ViaEnum via;

    @Column(name = "frequencia", nullable = false)
    private Integer frequencia;

    @Column(name = "limiar_db")
    private Integer limiarDb;

    @Column(name = "mascarado", nullable = false)
    private boolean mascarado;

    @Column(name = "sem_resposta", nullable = false)
    private boolean semResposta;

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }
}
