package com.api.ero_erp.crm.andamento.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "crm_andamento")
@Getter @Setter @NoArgsConstructor
public class Andamento extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = true)
    private Cliente cliente;

    @Column(name = "nome", length = 100)
    private String nome;

    @Column(name = "ativo")
    private Boolean ativo;

    @Column(name = "conclui_atendimento")
    private Boolean concluiAtendimento;

    @Column(name = "cancela_atendimento")
    private Boolean cancelaAtendimento;

    @Column(name = "sistema")
    private Boolean sistema;

    @Column(name = "chave", length = 30)
    private String chave;

    @Column(name = "cor", length = 20)
    private String cor;

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.ativo              == null) this.ativo              = true;
        if (this.sistema            == null) this.sistema            = false;
        if (this.concluiAtendimento == null) this.concluiAtendimento = false;
        if (this.cancelaAtendimento == null) this.cancelaAtendimento = false;
    }
}
