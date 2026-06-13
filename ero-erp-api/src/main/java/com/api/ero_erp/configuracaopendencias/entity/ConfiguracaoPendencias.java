package com.api.ero_erp.configuracaopendencias.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "configuracao_pendencias")
@Getter
@Setter
@NoArgsConstructor
public class ConfiguracaoPendencias extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(name = "dias_antes")
    private Integer diasAntes;

    @Column(name = "notificar_clientes_vencimento", length = 3)
    private String notificarClientesVencimento;

    @Column(name = "mensagem_aviso", columnDefinition = "TEXT")
    private String mensagemAviso;
}
