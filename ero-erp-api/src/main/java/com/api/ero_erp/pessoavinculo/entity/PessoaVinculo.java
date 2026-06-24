package com.api.ero_erp.pessoavinculo.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoavinculo.enums.TipoVinculo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pessoa_vinculo")
@Getter
@Setter
@NoArgsConstructor
public class PessoaVinculo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_origem_id", nullable = false)
    private Pessoa pessoaOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_destino_id", nullable = false)
    private Pessoa pessoaDestino;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoVinculo tipo;

    @Column(name = "observacao", length = 255)
    private String observacao;
}
