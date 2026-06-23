package com.api.ero_erp.configuracaopedido.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "configuracao_pedido")
@Getter @Setter @NoArgsConstructor
public class ConfiguracaoPedido extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(name = "faturar_ao_concluir", length = 10)
    private String faturarAoConcluir;

    @Column(name = "devolucao_gerar_credito", length = 10)
    private String devolucaoGerarCredito;
}
