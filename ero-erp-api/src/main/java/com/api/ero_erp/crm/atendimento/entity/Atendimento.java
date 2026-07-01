package com.api.ero_erp.crm.atendimento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.crm.andamento.entity.Andamento;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_atendimento")
@Getter @Setter @NoArgsConstructor
public class Atendimento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Column(name = "numero", nullable = false, length = 20)
    private String numero;

    @Column(name = "contato_nome", length = 255)
    private String contatoNome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "andamento_id", nullable = false)
    private Andamento andamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "assunto", length = 255)
    private String assunto;

    @Column(name = "data_abertura")
    private LocalDateTime dataAbertura;

    @Column(name = "data_ultima_mensagem")
    private LocalDateTime dataUltimaMensagem;

    @Column(name = "data_ultima_mensagem_cliente")
    private LocalDateTime dataUltimaMensagemCliente;

    @Column(name = "ultimo_lembrete_horas")
    private Integer ultimoLembreteHoras;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "ativo")
    private Boolean ativo;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.ativo         == null) this.ativo         = true;
        if (this.dataAbertura  == null) this.dataAbertura  = LocalDateTime.now();
    }
}
