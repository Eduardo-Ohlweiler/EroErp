package com.api.ero_erp.servico.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.filial.entity.Filial;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * O valor do serviço numa filial. Opcional: {@code null} é "não informado",
 * que não é o mesmo que zero.
 */
@Entity
@Table(name = "servico_filial")
@Getter
@Setter
@NoArgsConstructor
public class ServicoFilial extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filial_id", nullable = false)
    private Filial filial;

    @Column(name = "valor", precision = 15, scale = 2)
    private BigDecimal valor;
}
