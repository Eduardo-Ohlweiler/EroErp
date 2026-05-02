package com.api.ero_erp.estado.repository;

import com.api.ero_erp.estado.entity.Estado;
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
public interface EstadoRepository extends JpaRepository<Estado, Long> {

    boolean existsBySiglaIgnoreCase(String sigla);

    Optional<Estado> findBySiglaIgnoreCase(String sigla);

    @Query("""
        SELECT e FROM Estado e
        WHERE e.ativo = true
            ORDER BY e.nome
    """)
    List<Estado> findForSelect();

    @Query("""
    SELECT e FROM Estado e
    WHERE (:nome IS NULL OR LOWER(e.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
      AND (:sigla IS NULL OR LOWER(e.sigla) = LOWER(:sigla))
      AND (:codigoIbge IS NULL OR e.codigoIbge = :codigoIbge)
      AND (:ativo IS NULL OR e.ativo = :ativo)
""")
    Page<Estado> findAllWithFilters(
            Pageable pageable,
            @Param("nome") String nome,
            @Param("sigla") String sigla,
            @Param("codigoIbge") Integer codigoIbge,
            @Param("ativo") Boolean ativo
    );
}