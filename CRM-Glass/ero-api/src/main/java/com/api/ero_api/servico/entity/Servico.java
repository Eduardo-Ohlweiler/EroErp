package com.api.ero_api.servico.entity;

import com.api.ero_api.auxiliar.entity.CategoriaServico;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;

/**
 * Serviço que o contratante presta. Tabela própria (nunca um produto com tipo).
 *
 * <p>Não há preço aqui: o preço é só por filial, em {@link ServicoFilial}, que também diz
 * onde o serviço é prestado (pelo menos uma filial). Sem coleção: as filiais têm o próprio
 * repository e a lista do salvar substitui a anterior (como as filhas da pessoa).
 */
@Entity
@Table(name = "servico")
@DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
public class Servico extends TenantEntity {

    /** Código por contratante (maior + 1, ver docs/01). Nunca muda nem vem na entrada. */
    @Column(name = "cod_servico", nullable = false, updatable = false)
    private Long codServico;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    /** {@code TextoBusca.normalizar(nome)}: o nome é único no contratante sem caixa nem acento. */
    @Column(name = "nome_busca", nullable = false, length = 150)
    private String nomeBusca;

    /** Opcional. Inativa já gravada continua; inativa nova é recusada (service). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_servico_id")
    private CategoriaServico categoria;

    /** Opcional, de 1 a 1440 ({@code ck_servico_duracao_minutos}). A agenda vai usar para reservar o horário. */
    @Column(name = "duracao_minutos")
    private Integer duracaoMinutos;

    @Column(name = "descricao", length = 2000)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;
}
