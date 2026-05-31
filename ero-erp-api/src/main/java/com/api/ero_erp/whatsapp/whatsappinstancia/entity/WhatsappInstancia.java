package com.api.ero_erp.whatsapp.whatsappinstancia.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "whatsapp_instancia")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappInstancia extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nome", length = 100, nullable = false)
    private String nome;

    @Column(name = "instance_name", length = 100, nullable = false)
    private String instanceName;

    @Column(name = "token", columnDefinition = "TEXT")
    private String token;

    @Column(name = "timezone", length = 50)
    private String timezone = "America/Sao_Paulo";

    @Column(name = "antecedencia_minutos")
    private Integer antecedenciaMinutos = 60;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null)              this.ativo = true;
        if (this.antecedenciaMinutos == null) this.antecedenciaMinutos = 60;
        if (this.timezone == null)            this.timezone = "America/Sao_Paulo";
    }
}
