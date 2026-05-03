package com.api.ero_erp.cidade.repository;

import com.api.ero_erp.cidade.entity.Cidade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CidadeRepository extends JpaRepository<Cidade, Long> {

    boolean existsByCodigoIbge(Integer codigoIbge);

    boolean existsByNomeIgnoreCaseAndEstadoId(
            String nome,
            Long   estadoId
    );

    @Query("""
        SELECT c FROM Cidade c
            JOIN FETCH c.estado
        WHERE
            (:nome       IS NULL OR LOWER(c.nome)       LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            AND (:estadoId   IS NULL OR c.estado.id         = :estadoId)
            AND (:codigoIbge IS NULL OR c.codigoIbge        = :codigoIbge)
            AND (:ativo      IS NULL OR c.ativo             = :ativo)
    """)
    Page<Cidade> findAllWithFilters(
            Pageable pageable,
            @Param("nome")       String  nome,
            @Param("estadoId")   Long    estadoId,
            @Param("codigoIbge") Integer codigoIbge,
            @Param("ativo")      Boolean ativo
    );

    @Query("""
        SELECT c FROM Cidade c
            JOIN FETCH c.estado
        WHERE
            c.ativo = true
            AND (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        ORDER BY c.nome
    """)
    List<Cidade> findForSelect(
            @Param("nome")      String nome
    );

    @Query("""
        SELECT c FROM Cidade c
            JOIN FETCH c.estado
        WHERE c.id = :id
    """)
    Optional<Cidade> findByIdAndClienteId(
            @Param("id")        Long id
    );

    @Query("""
        SELECT c FROM Cidade c
        WHERE LOWER(c.nome) = LOWER(:nome)
            AND c.estado.id    = :estadoId
    """)
    Optional<Cidade> findByNomeAndEstadoAndCliente(
            @Param("nome")      String nome,
            @Param("estadoId")  Long   estadoId
    );
}