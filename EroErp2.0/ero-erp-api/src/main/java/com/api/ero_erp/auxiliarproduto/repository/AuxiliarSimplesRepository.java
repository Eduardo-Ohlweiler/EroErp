package com.api.ero_erp.auxiliarproduto.repository;

import com.api.ero_erp.auxiliarproduto.entity.AuxiliarProdutoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * O contrato dos três auxiliares que são só nome — grupo, categoria e marca.
 * Cada repositório concreto escreve a native dele: o nome da tabela não é
 * parâmetro.
 */
@NoRepositoryBean
public interface AuxiliarSimplesRepository<T extends AuxiliarProdutoEntity> extends JpaRepository<T, UUID> {

    // ─── Escopo do tenant — nunca findById solto ────────────────────────
    Optional<T> findByIdAndTenantId(UUID id, UUID tenantId);

    /** Nome já usado no tenant, sem diferenciar maiúscula nem acento. */
    boolean existeNome(UUID tenantId, String nome, UUID ignorarId);

    /** Listagem com filtros opcionais, em ordem de nome. */
    Page<T> findWithFilters(Pageable pageable, UUID tenantId, String termo, Boolean ativo);

    /** Combo: só ativos. */
    List<T> findForSelect(UUID tenantId, String termo);
}
