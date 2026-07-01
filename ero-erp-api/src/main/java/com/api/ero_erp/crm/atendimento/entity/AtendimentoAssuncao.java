package com.api.ero_erp.crm.atendimento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_atendimento_assuncao")
@Getter @Setter @NoArgsConstructor
public class AtendimentoAssuncao extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atendimento_id", nullable = false)
    private Atendimento atendimento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_anterior_id")
    private Usuario usuarioAnterior;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "data")
    private LocalDateTime data;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.data == null) this.data = LocalDateTime.now();
    }
}
