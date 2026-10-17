package com.api.ero_erp.auxiliarproduto.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

/**
 * Base dos auxiliares do produto — grupo, subgrupo, categoria e marca. Por
 * tenant, ao contrário da unidade de medida: cada cliente organiza o que vende
 * do seu jeito. Ver a migration {@code 022-create-produto-auxiliares.xml}.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class AuxiliarProdutoEntity extends TenantEntity {

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}
