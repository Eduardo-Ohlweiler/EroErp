package com.api.ero_erp.avaliacao.repository;

import com.api.ero_erp.avaliacao.entity.AvaliacaoFisica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvaliacaoFisicaRepository extends JpaRepository<AvaliacaoFisica, Long> {

    @Query("""
        SELECT a FROM AvaliacaoFisica a
        LEFT JOIN FETCH a.medidas
        LEFT JOIN FETCH a.composicao
        WHERE a.id = :id
          AND a.cliente.id = :clienteId
        """)
    Optional<AvaliacaoFisica> findByIdWithDetails(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
        SELECT a FROM AvaliacaoFisica a
        WHERE a.cliente.id = :clienteId
          AND (:pessoaId IS NULL OR a.pessoa.id = :pessoaId)
          AND (CAST(:dataInicio AS date) IS NULL OR a.dataAvaliacao >= :dataInicio)
          AND (CAST(:dataFim AS date) IS NULL OR a.dataAvaliacao <= :dataFim)
        """)
    Page<AvaliacaoFisica> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long      clienteId,
            @Param("pessoaId")   Long      pessoaId,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim")    LocalDate dataFim
    );

    @Query("""
        SELECT a FROM AvaliacaoFisica a
        LEFT JOIN FETCH a.medidas
        LEFT JOIN FETCH a.composicao
        WHERE a.cliente.id = :clienteId
          AND a.pessoa.id = :pessoaId
          AND a.ativo = true
        ORDER BY a.dataAvaliacao ASC
        """)
    List<AvaliacaoFisica> findEvolucaoByPessoa(
            @Param("clienteId") Long clienteId,
            @Param("pessoaId")  Long pessoaId
    );
}
