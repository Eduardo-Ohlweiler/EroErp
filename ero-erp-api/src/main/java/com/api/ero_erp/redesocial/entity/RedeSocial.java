package com.api.ero_erp.redesocial.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tiporedesocial.entity.TipoRedeSocial;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rede_social")
@Getter
@Setter
@NoArgsConstructor
public class RedeSocial extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_rede_social_id", nullable = false)
    private TipoRedeSocial tipoRedeSocial;

    @Column(name = "usuario", length = 255)
    private String usuario;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "observacao", length = 255)
    private String observacao;
}