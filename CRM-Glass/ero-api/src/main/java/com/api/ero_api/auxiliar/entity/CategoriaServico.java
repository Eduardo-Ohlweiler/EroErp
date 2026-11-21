package com.api.ero_api.auxiliar.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Categoria de serviço do contratante (cadastro auxiliar do serviço). Cópia da
 * {@link Profissao} sem itens do sistema: não há {@code chave} nem semente, e todo item
 * se edita, inativa e reativa.
 */
@Entity
@Table(name = "categoria_servico")
@Getter
@Setter
@NoArgsConstructor
public class CategoriaServico extends TenantEntity {

    /** Código por contratante (maior + 1, ver docs/01). Nunca muda nem vem na entrada. */
    @Column(name = "cod_categoria_servico", nullable = false, updatable = false)
    private Long codCategoriaServico;

    @Column(name = "nome", nullable = false, length = 40)
    private String nome;

    /** {@code TextoBusca.normalizar(nome)}: o nome é único no contratante sem caixa nem acento. */
    @Column(name = "nome_busca", nullable = false, length = 40)
    private String nomeBusca;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;
}
