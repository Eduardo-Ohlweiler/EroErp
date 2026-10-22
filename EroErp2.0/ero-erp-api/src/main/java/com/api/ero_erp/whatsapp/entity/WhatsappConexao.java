package com.api.ero_erp.whatsapp.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.config.CriptoConverter;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.whatsapp.enums.StatusConexao;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Uma instância na Evolution: o número do tenant inteiro ({@code filial}
 * nula) ou o de uma filial. Ver docs/13.
 */
@Entity
@Table(name = "whatsapp_conexao")
@Getter
@Setter
@NoArgsConstructor
public class WhatsappConexao extends TenantEntity {

    /** Nula = a conexão do tenant inteiro. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filial_id")
    private Filial filial;

    /** Gerada pelo sistema, única no servidor — que é de todos os tenants. */
    @Column(name = "instancia", nullable = false, length = 60, updatable = false)
    private String instancia;

    /** Sobrescrita do servidor global, só do superadmin. Nula = o global. */
    @Column(name = "url", length = 255)
    private String url;

    @Convert(converter = CriptoConverter.class)
    @Column(name = "api_key")
    private String apiKey;

    /** Só dígitos, com DDI, como a Evolution informou ao conectar. */
    @Column(name = "numero", length = 20)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusConexao status = StatusConexao.DESCONECTADO;

    /** Quando o status mudou pela última vez. */
    @Column(name = "status_em")
    private Instant statusEm;

    /** O caminho do webhook. Quem não o tem não fala por esta conexão. */
    @Column(name = "webhook_segredo", nullable = false, length = 64, updatable = false)
    private String webhookSegredo;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    /** Muda o status e carimba a hora — só quando muda de fato. */
    public void mudarStatus(StatusConexao novo, Instant agora) {
        if (novo == this.status) return;
        this.status = novo;
        this.statusEm = agora;
    }
}
