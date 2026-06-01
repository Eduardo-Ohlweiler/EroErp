package com.api.ero_erp.whatsapp.whatsapplog.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.whatsapp.whatsapplog.enums.WhatsappLogStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_log")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compromisso_id", nullable = false)
    private Compromisso compromisso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WhatsappLogStatus status = WhatsappLogStatus.PENDENTE;

    @Column(name = "phone_cliente", length = 30)
    private String phoneCliente;

    @Column(name = "enviado_em")
    private LocalDateTime enviadoEm;

    @Column(name = "erro", columnDefinition = "TEXT")
    private String erro;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.status == null) this.status = WhatsappLogStatus.PENDENTE;
    }
}
