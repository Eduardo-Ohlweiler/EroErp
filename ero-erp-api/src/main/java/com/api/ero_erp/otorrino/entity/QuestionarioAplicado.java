package com.api.ero_erp.otorrino.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.clinica.entity.Consulta;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questionario_aplicado")
@Getter
@Setter
@NoArgsConstructor
public class QuestionarioAplicado extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id")
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "questionario_id", nullable = false)
    private Questionario questionario;

    @Column(name = "data_aplicacao", nullable = false)
    private LocalDate dataAplicacao;

    // ── Snapshot calculado no backend ───────────────────────────────────────
    @Column(name = "score_total")
    private Integer scoreTotal;

    @Column(name = "classificacao", length = 100)
    private String classificacao;

    @Column(name = "interpretacao", columnDefinition = "TEXT")
    private String interpretacao;

    @OneToMany(mappedBy = "aplicado", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionarioResposta> respostas = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
    }

    /** Adiciona uma resposta mantendo o back-reference consistente. */
    public void addResposta(QuestionarioResposta resposta) {
        resposta.setAplicado(this);
        this.respostas.add(resposta);
    }
}
