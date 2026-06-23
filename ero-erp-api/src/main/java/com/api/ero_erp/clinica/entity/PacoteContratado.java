package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.clinica.enums.StatusPacote;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.produto.entity.Produto;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "pacote_contratado")
@Getter
@Setter
@NoArgsConstructor
public class PacoteContratado extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "emitente_id", nullable = false)
    private Emitente emitente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "quantidade_sessoes", nullable = false)
    private Integer quantidadeSessoes;

    @Column(name = "valor_total", precision = 15, scale = 2, nullable = false)
    private BigDecimal valorTotal;

    @Column(name = "conta_receber_id")
    private Long contaReceberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusPacote status = StatusPacote.ATIVO;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.status == null)
            this.status = StatusPacote.ATIVO;
    }
}
