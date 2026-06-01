package com.api.ero_erp.configuracaomensagem.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "configuracao_mensagem")
@Getter
@Setter
@NoArgsConstructor
public class ConfiguracaoMensagem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "cabecalho_agendamento", columnDefinition = "TEXT")
    private String cabecalhoAgendamento;

    @Column(name = "rodape_agendamento", columnDefinition = "TEXT")
    private String rodapeAgendamento;

    @Column(name = "cabecalho_lembrete", columnDefinition = "TEXT")
    private String cabecalhoLembrete;

    @Column(name = "rodape_lembrete", columnDefinition = "TEXT")
    private String rodapeLembrete;

    @Column(name = "cabecalho_cancelamento", columnDefinition = "TEXT")
    private String cabecalhoCancelamento;

    @Column(name = "rodape_cancelamento", columnDefinition = "TEXT")
    private String rodapeCancelamento;

    @Column(name = "cabecalho_conclusao", columnDefinition = "TEXT")
    private String cabecalhoConclusao;

    @Column(name = "rodape_conclusao", columnDefinition = "TEXT")
    private String rodapeConclusao;
}
