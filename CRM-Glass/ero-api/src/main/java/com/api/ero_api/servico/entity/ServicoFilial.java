package com.api.ero_api.servico.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.filial.entity.Filial;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filial onde o serviço é prestado, com o preço dela. Uma linha por filial
 * ({@code uk_servico_filial_servico_filial}). A lista do salvar substitui a anterior.
 */
@Entity
@Table(name = "servico_filial")
@Getter
@Setter
@NoArgsConstructor
public class ServicoFilial extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false, updatable = false)
    private Servico servico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filial_id", nullable = false)
    private Filial filial;

    /** Preço nesta filial. {@code null} = não informado (digitado no movimento); 0 = gratuito. */
    @Column(name = "valor", precision = 15, scale = 2)
    private BigDecimal valor;
}
