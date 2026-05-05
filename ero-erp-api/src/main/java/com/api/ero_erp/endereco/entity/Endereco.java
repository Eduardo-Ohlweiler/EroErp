package com.api.ero_erp.endereco.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cidade.entity.Cidade;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.tipoendereco.entity.TipoEndereco;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "endereco")
@Getter
@Setter
@NoArgsConstructor
public class Endereco extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_endereco_id", nullable = false)
    private TipoEndereco tipoEndereco;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cidade_id", nullable = false)
    private Cidade cidade;

    @Column(name = "cep", length = 8)
    private String cep;

    @Column(name = "rua", length = 255)
    private String rua;

    @Column(name = "numero", length = 20)
    private String numero;

    @Column(name = "bairro", length = 100)
    private String bairro;

    @Column(name = "complemento", length = 100)
    private String complemento;

    @Column(name = "principal", nullable = false)
    private Boolean principal = false;
}
