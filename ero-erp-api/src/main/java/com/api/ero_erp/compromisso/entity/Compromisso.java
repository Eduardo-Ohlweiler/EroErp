package com.api.ero_erp.compromisso.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "compromisso")
@Getter
@Setter
@NoArgsConstructor
public class Compromisso extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "descricao", length = 2000)
    private String descricao;

    @Column(name = "cor", nullable = false, length = 50)
    private String cor;

    @Column(name = "inicio", nullable = false)
    private LocalDateTime inicio;

    @Column(name = "fim", nullable = false)
    private LocalDateTime fim;

    @Column(name = "cancelado", nullable = false)
    private Boolean cancelado = false;

    @Column(name = "concluido", nullable = false)
    private Boolean concluido = false;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    @Column(name = "recorrencia_sim_nao", nullable = false)
    private Boolean recorrenciaSimNao = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recorrencia", length = 20)
    private TipoRecorrencia tipoRecorrencia;

    @Column(name = "quantidade_recorrencia")
    private Integer quantidadeRecorrencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compromisso_pai_id")
    private Compromisso compromissoPai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.cancelado == null)
            this.cancelado = false;
        if (this.concluido == null)
            this.concluido = false;
        if (this.recorrenciaSimNao == null)
            this.recorrenciaSimNao = false;
        if (this.cor == null)
            this.cor = "#3a87ad";
    }
}
