package com.api.ero_erp.tipoendereco.repository;

import com.api.ero_erp.tipoendereco.entity.TipoEndereco;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoEnderecoRepository extends JpaRepository<TipoEndereco, Long> {

    boolean existsByNomeIgnoreCase(String nome);

    Optional<TipoEndereco> findByNomeIgnoreCase(String nome);

    @Query("""
        SELECT t FROM TipoEndereco t
        WHERE (:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
    """)
    Page<TipoEndereco> findAllWithFilters(Pageable pageable, @Param("nome") String nome);

    @Query("SELECT t FROM TipoEndereco t " +
            "WHERE t.ativo = true " +
            "ORDER BY t.nome")
    List<TipoEndereco> findForSelect();
}