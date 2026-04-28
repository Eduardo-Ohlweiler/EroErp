package com.api.ero_erp.tiporedesocial.repository;

import com.api.ero_erp.tiporedesocial.entity.TipoRedeSocial;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoRedeSocialRepository extends JpaRepository<TipoRedeSocial, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<TipoRedeSocial> findByNomeIgnoreCase(String nome);

    @Query("""
        SELECT t FROM TipoRedeSocial t
            WHERE (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<TipoRedeSocial> findAllWithFilters(Pageable pageable, @Param("nome") String nome);

    @Query("SELECT t FROM TipoRedeSocial t " +
            "   WHERE t.ativo = true " +
            "ORDER BY t.nome")
    List<TipoRedeSocial> findForSelect();
}
