package com.api.ero_erp.ncm.repository;

import com.api.ero_erp.ncm.entity.Ncm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NcmRepository extends JpaRepository<Ncm, Long> {

    @Query("""
            SELECT n FROM Ncm n
            WHERE (:busca IS NULL
                   OR LOWER(n.codigo) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR LOWER(n.descricao) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
            """)
    Page<Ncm> findAllWithFilters(Pageable pageable, @Param("busca") String busca);

    @Query("""
            SELECT COUNT(n) > 0 FROM Ncm n
            WHERE LOWER(n.codigo) = LOWER(:codigo)
            AND (:excludeId IS NULL OR n.id <> :excludeId)
            """)
    boolean existsByCodigo(
            @Param("codigo")    String codigo,
            @Param("excludeId") Long   excludeId
    );
}
