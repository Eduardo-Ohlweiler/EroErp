package com.api.ero_erp.clinica.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.clinica.enums.StatusConsulta;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "consulta")
@Getter
@Setter
@NoArgsConstructor
public class Consulta extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compromisso_id")
    private Compromisso compromisso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "emitente_id", nullable = false)
    private Emitente emitente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StatusConsulta status = StatusConsulta.AGENDADA;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    @Column(name = "inicio", nullable = false)
    private LocalDateTime inicio;

    @Column(name = "fim", nullable = false)
    private LocalDateTime fim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_pai_id")
    private Consulta consultaPai;

    @Column(name = "tipo_ajuste_geral", length = 10)
    private String tipoAjusteGeral;

    @Column(name = "tipo_calculo_geral", length = 10)
    private String tipoCalculoGeral;

    @Column(name = "valor_ajuste_geral", precision = 15, scale = 2)
    private java.math.BigDecimal valorAjusteGeral;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_anamnese_id")
    private FichaAnamnese fichaAnamnese;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.status == null)
            this.status = StatusConsulta.AGENDADA;
    }
}
