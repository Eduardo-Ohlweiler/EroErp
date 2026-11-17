package com.api.ero_api.localidade.entity;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

/**
 * Município do IBGE (semente da migration 013), usado no endereço da pessoa.
 *
 * <p>NÃO é TenantEntity de propósito, como o {@link Estado}: dado de referência,
 * igual para todos os contratantes, só lido pela aplicação. Está na lista justificada
 * {@code ENTIDADES_SEM_TENANT} do ArquiteturaTest.
 */
@Entity
@Table(name = "cidade")
@Immutable
@Getter
@Setter
@NoArgsConstructor
public class Cidade extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estado_id", nullable = false)
    private Estado estado;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    /** {@code TextoBusca.normalizar(nome)}: a busca do combo é sem acento e sem caixa. */
    @Column(name = "nome_busca", nullable = false, length = 150)
    private String nomeBusca;

    @Column(name = "codigo_ibge", nullable = false)
    private Integer codigoIbge;
}
