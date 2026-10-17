package com.api.ero_erp.catalogo.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Unidade de medida do produto — catálogo global, sem tenant, como os tipos
 * do cadastro de pessoas. Tem sigla e descrição, por isso não estende
 * {@link CatalogoEntity}. Ver a migration {@code 021-create-unidade-medida.xml}.
 */
@Entity
@Table(name = "unidade_medida")
@Getter
@Setter
@NoArgsConstructor
public class UnidadeMedida extends BaseEntity {

    @Column(name = "sigla", nullable = false, length = 10)
    private String sigla;

    @Column(name = "descricao", nullable = false, length = 100)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}
