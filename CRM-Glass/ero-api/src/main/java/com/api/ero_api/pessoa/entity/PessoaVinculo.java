package com.api.ero_api.pessoa.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.pessoa.enums.TipoVinculo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Vínculo entre duas pessoas: "destino é {@code tipo} de origem". Uma linha serve os dois
 * cadastros; quem abre o destino vê a origem com o {@link TipoVinculo#inverso()}.
 *
 * <p>Orientação canônica: origem antes do destino na ordem do banco
 * ({@code ck_pessoa_vinculo_ordem}, {@code OrdemUuid}). Quem monta a linha é o
 * {@code PessoaMapper.vinculo}; as duas pessoas nunca mudam depois de gravada.
 */
@Entity
@Table(name = "pessoa_vinculo")
@Getter
@Setter
@NoArgsConstructor
public class PessoaVinculo extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_origem_id", nullable = false, updatable = false)
    private Pessoa pessoaOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_destino_id", nullable = false, updatable = false)
    private Pessoa pessoaDestino;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoVinculo tipo;

    @Column(name = "observacao", length = 255)
    private String observacao;
}
