package com.api.ero_erp.compromisso.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Compromisso da agenda. O responsável é o usuário que vai atender — não
 * necessariamente quem digitou, que fica em {@code createdBy}. Ver docs/12.
 */
@Entity
@Table(name = "compromisso")
@Getter
@Setter
@NoArgsConstructor
public class Compromisso extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filial_id", nullable = false)
    private Filial filial;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    /** O cliente. Compromisso interno (reunião) não tem. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private Pessoa pessoa;

    @Column(name = "titulo", nullable = false, length = 255)
    private String titulo;

    @Column(name = "descricao", length = 2000)
    private String descricao;

    /** Vazia: a cor da filial. */
    @Column(name = "cor", length = 7)
    private String cor;

    @Column(name = "inicio", nullable = false)
    private Instant inicio;

    @Column(name = "fim", nullable = false)
    private Instant fim;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusCompromisso status = StatusCompromisso.AGENDADO;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    /** As ocorrências de uma recorrência compartilham o mesmo valor. */
    @Column(name = "serie_id", updatable = false)
    private UUID serieId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recorrencia", length = 20, updatable = false)
    private TipoRecorrencia tipoRecorrencia;

    /** O convidado não vive sem o compromisso: grava e sai junto com ele. */
    @OneToMany(mappedBy = "compromisso", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CompromissoConvidado> convidados = new HashSet<>();

    /**
     * A consulta feita sobre este compromisso, se houver. Só leitura, no
     * mesmo SELECT: a agenda precisa saber disso em cada bloco, e um
     * {@code @OneToOne} inverso seria uma ida ao banco por compromisso. Quem
     * grava é o {@code ConsultaService}, do lado da consulta.
     */
    @Formula("(SELECT cs.id FROM consulta cs WHERE cs.compromisso_id = id)")
    private UUID consultaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    public String corExibicao() {
        return cor != null ? cor : filial.getCor();
    }
}
