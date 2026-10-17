package com.api.ero_erp.servico.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Serviço que o tenant presta — sem estoque, sem unidade. O valor é por
 * filial, em {@link ServicoFilial}. Ver docs/10.
 */
@Entity
@Table(name = "servico")
@Getter
@Setter
@NoArgsConstructor
public class Servico extends TenantEntity {

    /** Sequencial dentro do tenant, gerado pelo sistema; nunca muda. */
    @Column(name = "codigo", nullable = false, updatable = false)
    private Long codigo;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "observacao", length = 2000)
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    /**
     * Sem cascade: quem grava é o {@code ServicoService}, comparando a lista
     * que veio da tela com a que existe — como os contatos da pessoa.
     */
    @OneToMany(mappedBy = "servico", fetch = FetchType.LAZY)
    private List<ServicoFilial> filiais = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;
}
