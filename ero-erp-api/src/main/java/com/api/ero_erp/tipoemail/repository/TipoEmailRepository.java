package com.api.ero_erp.tipoemail.repository;

import com.api.ero_erp.tipoemail.entity.TipoEmail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoEmailRepository extends JpaRepository<TipoEmail, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<TipoEmail> findByNomeIgnoreCase(String nome);

    @Query("""
        SELECT t FROM TipoEmail t
        WHERE (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<TipoEmail> findAllWithFilters(Pageable pageable, @Param("nome") String nome);

    @Query("SELECT t FROM TipoEmail t " +
            "   WHERE t.ativo = true " +
            "ORDER BY t.nome")
    List<TipoEmail> findForSelect();
}
