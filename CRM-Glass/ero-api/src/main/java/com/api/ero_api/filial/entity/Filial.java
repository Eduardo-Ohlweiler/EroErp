package com.api.ero_api.filial.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.filial.enums.TipoFilial;
import com.api.ero_api.pessoa.entity.Pessoa;
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
import org.hibernate.annotations.DynamicUpdate;

/**
 * Matriz ou filial do contratante. Não duplica cadastro: aponta para uma {@link Pessoa}
 * (física ou jurídica), e o resto (documento, inscrições, endereço) fica nela.
 *
 * <p>Pessoa e matriz são {@code LAZY}: a lista e a ficha as trazem por {@code JOIN FETCH};
 * o {@code travarPorIds} não (o PostgreSQL recusa {@code FOR UPDATE} no lado nulo de um
 * outer join).
 */
@Entity
@Table(name = "filial")
@DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
public class Filial extends TenantEntity {

    /** Código por contratante (maior + 1, ver docs/01). Nunca muda nem vem na entrada. */
    @Column(name = "cod_filial", nullable = false, updatable = false)
    private Long codFilial;

    /** Uma pessoa é uma filial só ({@code uk_filial_tenant_pessoa}). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 10)
    private TipoFilial tipo;

    /** Só na filial: a matriz a que ela responde (sempre do tipo MATRIZ). Nula na matriz. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matriz_id")
    private Filial matriz;

    /** {@code #RRGGBB} em maiúsculas. Dado do usuário: o front só a aplica pelo kit. */
    @Column(name = "cor", nullable = false, length = 7)
    private String cor;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    public boolean ehMatriz() {
        return tipo == TipoFilial.MATRIZ;
    }
}
