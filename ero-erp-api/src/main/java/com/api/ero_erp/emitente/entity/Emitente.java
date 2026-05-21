package com.api.ero_erp.emitente.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.enums.TipoEmitente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "emitente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Emitente extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /**
     * Uma pessoa só pode estar vinculada a um único emitente.
     * Garantido por unique constraint no banco + validação no service.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, unique = true)
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoEmitente tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_matriz_id")
    private Pessoa pessoaMatriz;

    @Column(name = "cor", nullable = false, length = 50)
    private String cor;

    @Column(name = "bloqueado", nullable = false)
    private Boolean bloqueado;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.bloqueado == null) {
            this.bloqueado = false;
        }
    }
}