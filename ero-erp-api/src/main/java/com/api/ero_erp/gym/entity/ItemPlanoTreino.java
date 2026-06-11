package com.api.ero_erp.gym.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.gym.enums.DiaSemanaGym;
import com.api.ero_erp.gym.enums.TipoExecucao;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "item_plano_treino")
@Getter
@Setter
@NoArgsConstructor
public class ItemPlanoTreino extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plano_id", nullable = false)
    private PlanoTreino plano;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercicio_id")
    private Exercicio exercicio;

    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana", nullable = false, length = 20)
    private DiaSemanaGym diaSemana;

    @Column(name = "ordem", nullable = false)
    private int ordem;

    @Column(name = "series")
    private Integer series;

    @Column(name = "repeticoes", length = 50)
    private String repeticoes;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_execucao", length = 30)
    private TipoExecucao tipoExecucao;

    @Column(name = "pausa_segundos")
    private Integer pausaSegundos;

    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;
}
