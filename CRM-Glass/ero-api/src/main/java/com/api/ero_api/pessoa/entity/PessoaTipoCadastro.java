package com.api.ero_api.pessoa.entity;

import com.api.ero_api.auxiliar.entity.TipoCadastro;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Um tipo de cadastro marcado na pessoa (N:N). A lista do salvar substitui a anterior. */
@Entity
@Table(name = "pessoa_tipo_cadastro")
@Getter
@Setter
@NoArgsConstructor
public class PessoaTipoCadastro extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false, updatable = false)
    private Pessoa pessoa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_cadastro_id", nullable = false)
    private TipoCadastro tipoCadastro;
}
