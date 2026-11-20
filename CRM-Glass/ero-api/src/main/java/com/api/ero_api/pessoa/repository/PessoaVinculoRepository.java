package com.api.ero_api.pessoa.repository;

import com.api.ero_api.pessoa.entity.PessoaVinculo;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Vínculos entre pessoas. O filtro de tenant é automático em todo JPQL. */
public interface PessoaVinculoRepository extends JpaRepository<PessoaVinculo, UUID> {

    /** Os vínculos da pessoa, dos dois lados (origem ou destino), com as duas pessoas junto. */
    @Query("""
            SELECT v FROM PessoaVinculo v
            JOIN FETCH v.pessoaOrigem
            JOIN FETCH v.pessoaDestino
            WHERE v.pessoaOrigem.id = :pessoaId OR v.pessoaDestino.id = :pessoaId
            """)
    List<PessoaVinculo> buscarPorPessoa(@Param("pessoaId") UUID pessoaId);

    /** Vínculos que saíram da lista. As duas pessoas já estão travadas por quem chama. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM PessoaVinculo v
            WHERE v.id IN :ids
            """)
    int removerPorIds(@Param("ids") Collection<UUID> ids);
}
