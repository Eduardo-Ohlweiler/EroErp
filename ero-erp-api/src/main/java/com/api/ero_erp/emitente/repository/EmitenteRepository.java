package com.api.ero_erp.emitente.repository;

import com.api.ero_erp.emitente.entity.Emitente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmitenteRepository extends JpaRepository<Emitente, Long> {

    @Query("""
            SELECT COUNT(e) > 0 FROM Emitente e
            WHERE e.pessoa.id = :pessoaId
            AND (:excludeId IS NULL OR e.id <> :excludeId)
            """)
    boolean existsByPessoaId(
            @Param("pessoaId")   Long pessoaId,
            @Param("excludeId")  Long excludeId
    );

    @Query("""
            SELECT e FROM Emitente e
            JOIN FETCH e.pessoa
            JOIN FETCH e.cliente
            LEFT JOIN FETCH e.pessoaMatriz
            WHERE e.id = :id
            AND e.cliente.id = :clienteId
            """)
    Optional<Emitente> findByIdAndClienteId(
            @Param("id")        Long id,
            @Param("clienteId") Long clienteId
    );

    @Query("""
            SELECT e FROM Emitente e
            JOIN FETCH e.pessoa
            JOIN FETCH e.cliente
            LEFT JOIN FETCH e.pessoaMatriz
            WHERE e.cliente.id = :clienteId
            AND (:bloqueado IS NULL OR e.bloqueado = :bloqueado)
            AND (:nome IS NULL OR LOWER(e.pessoa.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            """)
    Page<Emitente> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId")  Long    clienteId,
            @Param("bloqueado")  Boolean bloqueado,
            @Param("nome")       String  nome
    );

    @Query("""
            SELECT e FROM Emitente e
            JOIN FETCH e.pessoa
            WHERE e.cliente.id = :clienteId
            AND e.bloqueado = false
            AND (:nome IS NULL OR LOWER(e.pessoa.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY e.pessoa.nome
            """)
    List<Emitente> findForSelect(
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );
}