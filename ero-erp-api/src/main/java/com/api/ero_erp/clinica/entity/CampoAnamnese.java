package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.clinica.enums.TipoCampoAnamnese;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "campo_anamnese")
@Getter
@Setter
@NoArgsConstructor
public class CampoAnamnese extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private TemplateAnamnese template;

    @Column(name = "secao", length = 200)
    private String secao;

    @Column(name = "rotulo", nullable = false, length = 300)
    private String rotulo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoCampoAnamnese tipo;

    @Column(name = "opcoes", columnDefinition = "TEXT")
    private String opcoes;

    @Column(name = "ordem", nullable = false)
    private Integer ordem = 0;

    @Column(name = "obrigatorio", nullable = false)
    private Boolean obrigatorio = false;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ordem == null)       this.ordem      = 0;
        if (this.obrigatorio == null) this.obrigatorio = false;
        if (this.ativo == null)       this.ativo       = true;
    }
}
