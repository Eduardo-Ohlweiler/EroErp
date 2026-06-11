package com.api.ero_erp.gym.repository;

import com.api.ero_erp.gym.entity.Exercicio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExercicioRepository extends JpaRepository<Exercicio, Long> {

    Optional<Exercicio> findByIdAndClienteId(Long id, Long clienteId);

    @Query("""
        SELECT e FROM Exercicio e
        WHERE e.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(e.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        """)
    Page<Exercicio> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long   clienteId,
            @Param("nome")      String nome
    );

    List<Exercicio> findByClienteIdAndAtivoTrue(Long clienteId);
}
