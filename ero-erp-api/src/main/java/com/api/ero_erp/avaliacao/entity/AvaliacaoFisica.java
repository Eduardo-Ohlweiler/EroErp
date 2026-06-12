package com.api.ero_erp.avaliacao.entity;

import com.api.ero_erp.avaliacao.enums.ObjetivoAvaliacao;
import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.pessoa.entity.Pessoa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "avaliacao_fisica")
@Getter
@Setter
@NoArgsConstructor
public class AvaliacaoFisica extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate dataAvaliacao;

    @Column(name = "peso", nullable = false, precision = 5, scale = 2)
    private BigDecimal peso;

    @Column(name = "altura", nullable = false, precision = 5, scale = 2)
    private BigDecimal altura;

    @Column(name = "imc", precision = 5, scale = 2)
    private BigDecimal imc;

    @Column(name = "idade", nullable = false)
    private Integer idade;

    @Column(name = "sexo", nullable = false, length = 1)
    private String sexo;

    @Enumerated(EnumType.STRING)
    @Column(name = "objetivo", nullable = false, length = 30)
    private ObjetivoAvaliacao objetivo;

    @Column(name = "meta_descricao", columnDefinition = "TEXT")
    private String metaDescricao;

    @Column(name = "peso_alvo", precision = 5, scale = 2)
    private BigDecimal pesoAlvo;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @OneToMany(mappedBy = "avaliacao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedidaCorporal> medidas = new ArrayList<>();

    @OneToOne(mappedBy = "avaliacao", cascade = CascadeType.ALL, orphanRemoval = true)
    private ComposicaoCorporal composicao;

    @PrePersist
    public void prePersist() {
        super.prePersist();
        this.ativo = true;
    }
}
