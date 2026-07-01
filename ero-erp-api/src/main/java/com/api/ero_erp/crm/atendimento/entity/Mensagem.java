package com.api.ero_erp.crm.atendimento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.crm.atendimento.enums.DirecaoMensagem;
import com.api.ero_erp.crm.atendimento.enums.TipoMensagem;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_mensagem")
@Getter @Setter @NoArgsConstructor
public class Mensagem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atendimento_id", nullable = false)
    private Atendimento atendimento;

    @Enumerated(EnumType.STRING)
    @Column(name = "direcao", nullable = false, length = 10)
    private DirecaoMensagem direcao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoMensagem tipo;

    @Column(name = "conteudo", columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "midia_mimetype", length = 100)
    private String midiaMimetype;

    @Column(name = "midia_nome", length = 255)
    private String midiaNome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "evolution_message_id", length = 255)
    private String evolutionMessageId;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "data_mensagem")
    private LocalDateTime dataMensagem;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.dataMensagem == null) this.dataMensagem = LocalDateTime.now();
    }
}
