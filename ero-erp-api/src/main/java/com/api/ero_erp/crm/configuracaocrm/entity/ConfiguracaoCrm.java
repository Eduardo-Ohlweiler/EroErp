package com.api.ero_erp.crm.configuracaocrm.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.crm.lembretependencia.entity.CrmLembretePendencia;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "configuracao_crm")
@Getter @Setter @NoArgsConstructor
public class ConfiguracaoCrm extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(name = "provedor", length = 20)
    private String provedor;

    @Column(name = "api_url", length = 255)
    private String apiUrl;

    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey;

    @Column(name = "instance_name", length = 100)
    private String instanceName;

    @Column(name = "token", columnDefinition = "TEXT")
    private String token;

    @Column(name = "numero", length = 20)
    private String numero;

    @Column(name = "ativo")
    private Boolean ativo;

    @Column(name = "ativar_pendencias")
    private Boolean ativarPendencias;

    @Column(name = "enviar_confirmacao_leitura")
    private Boolean enviarConfirmacaoLeitura;

    @OneToMany(mappedBy = "configuracaoCrm", fetch = FetchType.LAZY)
    private List<CrmLembretePendencia> lembretes = new ArrayList<>();

    @PrePersist
    @Override
    public void prePersist() {
        super.prePersist();
        if (this.provedor                 == null) this.provedor                 = "EVOLUTION";
        if (this.ativo                    == null) this.ativo                    = true;
        if (this.ativarPendencias         == null) this.ativarPendencias         = false;
        if (this.enviarConfirmacaoLeitura == null) this.enviarConfirmacaoLeitura = false;
    }
}
