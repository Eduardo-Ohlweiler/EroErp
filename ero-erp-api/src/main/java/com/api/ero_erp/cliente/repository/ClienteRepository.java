package com.api.ero_erp.cliente.repository;

import com.api.ero_erp.cliente.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente,Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Cliente> findByEmailIgnoreCase(String email);

    @Query("""
    SELECT c FROM Cliente c
        WHERE (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            AND   (:email IS NULL OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:email AS string), '%')))
    """)
    Page<Cliente> findAllWithFilters(
            Pageable pageable,
            @Param("nome")  String nome,
            @Param("email") String email
    );

    @Query("""
        SELECT c FROM Cliente c
            WHERE c.ativo = true
                AND (:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
            ORDER BY c.nome
    """)
    List<Cliente> findForSelect(@Param("nome") String nome);
}
