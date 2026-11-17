package com.api.ero_api.auxiliar.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tipo de cadastro do contratante (cadastro auxiliar da pessoa).
 *
 * <p>Item do sistema ({@code chave} preenchida, ex.: {@code CLIENTE}) é semeado em cada
 * contratante e é imutável: não se edita nem se inativa (o banco confere com
 * {@code ck_tipo_cadastro_sistema_ativo}). Item do contratante tem {@code chave} nula.
 */
@Entity
@Table(name = "tipo_cadastro")
@Getter
@Setter
@NoArgsConstructor
public class TipoCadastro extends TenantEntity {

    /** Código por contratante (maior + 1, ver docs/01). Nunca muda nem vem na entrada. */
    @Column(name = "cod_tipo_cadastro", nullable = false, updatable = false)
    private Long codTipoCadastro;

    @Column(name = "nome", nullable = false, length = 25)
    private String nome;

    /** {@code TextoBusca.normalizar(nome)}: o nome é único no contratante sem caixa nem acento. */
    @Column(name = "nome_busca", nullable = false, length = 25)
    private String nomeBusca;

    /** Nome da constante de {@code TipoCadastroDoSistema}; nula = item do contratante. */
    @Column(name = "chave", length = 30, updatable = false)
    private String chave;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    /** Item do sistema (pré-cadastrado e imutável). */
    public boolean sistema() {
        return chave != null;
    }
}
