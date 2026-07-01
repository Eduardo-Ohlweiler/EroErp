package com.api.ero_erp.crm.lembretependencia.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.crm.configuracaocrm.entity.ConfiguracaoCrm;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "crm_lembrete_pendencia")
@Getter @Setter @NoArgsConstructor
public class CrmLembretePendencia extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "configuracao_crm_id", nullable = false)
    private ConfiguracaoCrm configuracaoCrm;

    @Column(name = "tempo_horas")
    private Integer tempoHoras;

    @Column(name = "mensagem", columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "ordem")
    private Integer ordem;
}
