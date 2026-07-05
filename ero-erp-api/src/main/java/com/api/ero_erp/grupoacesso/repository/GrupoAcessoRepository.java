package com.api.ero_erp.grupoacesso.repository;

import com.api.ero_erp.grupoacesso.entity.GrupoAcesso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GrupoAcessoRepository extends JpaRepository<GrupoAcesso, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<GrupoAcesso> findByNomeIgnoreCase(String nome);

    List<GrupoAcesso> findAllByOrderByNomeAsc();

    @Query("SELECT DISTINCT g FROM GrupoAcesso g LEFT JOIN FETCH g.roles WHERE g.id = :id")
    Optional<GrupoAcesso> findByIdWithRoles(@Param("id") Long id);

    @Query("""
        SELECT g FROM GrupoAcesso g
            WHERE (:nome IS NULL OR LOWER(g.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<GrupoAcesso> findAllWithFilters(Pageable pageable, @Param("nome") String nome);
}
