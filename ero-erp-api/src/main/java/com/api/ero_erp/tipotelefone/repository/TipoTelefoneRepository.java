package com.api.ero_erp.tipotelefone.repository;

import com.api.ero_erp.tipotelefone.entity.TipoTelefone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoTelefoneRepository extends JpaRepository<TipoTelefone, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<TipoTelefone> findByNomeIgnoreCase(String nome);

    @Query("""
        SELECT t FROM TipoTelefone t
        WHERE (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<TipoTelefone> findAllWithFilters(Pageable pageable, @Param("nome") String nome);

    @Query("SELECT t FROM TipoTelefone t WHERE t.ativo = true ORDER BY t.nome")
    List<TipoTelefone> findForSelect();
}

