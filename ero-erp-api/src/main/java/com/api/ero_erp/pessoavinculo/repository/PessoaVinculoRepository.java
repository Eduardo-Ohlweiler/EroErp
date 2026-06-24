package com.api.ero_erp.pessoavinculo.repository;

import com.api.ero_erp.pessoavinculo.entity.PessoaVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PessoaVinculoRepository extends JpaRepository<PessoaVinculo, Long> {

    Optional<PessoaVinculo> findByIdAndClienteId(Long id, Long clienteId);

    @Query("""
        SELECT v FROM PessoaVinculo v
        WHERE v.cliente.id = :clienteId
            AND (v.pessoaOrigem.id = :pessoaId OR v.pessoaDestino.id = :pessoaId)
    """)
    List<PessoaVinculo> findByPessoaIdAndClienteId(
            @Param("pessoaId")  Long pessoaId,
            @Param("clienteId") Long clienteId
    );

    boolean existsByClienteIdAndPessoaOrigem_IdAndPessoaDestino_Id(
            Long clienteId, Long pessoaOrigemId, Long pessoaDestinoId
    );
}
