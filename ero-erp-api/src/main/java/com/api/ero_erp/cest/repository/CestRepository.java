package com.api.ero_erp.cest.repository;

import com.api.ero_erp.cest.entity.Cest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CestRepository extends JpaRepository<Cest, Long> {

    @Query("""
            SELECT c FROM Cest c
            JOIN FETCH c.ncm
            WHERE (:ncmId IS NULL OR c.ncm.id = :ncmId)
            AND (:busca IS NULL
                 OR LOWER(c.codigo) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                 OR LOWER(c.descricao) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
            """)
    Page<Cest> findAllWithFilters(
            Pageable pageable,
            @Param("ncmId") Long   ncmId,
            @Param("busca") String busca
    );

    @Query("""
            SELECT COUNT(c) > 0 FROM Cest c
            WHERE LOWER(c.codigo) = LOWER(:codigo)
            AND (:excludeId IS NULL OR c.id <> :excludeId)
            """)
    boolean existsByCodigo(
            @Param("codigo")    String codigo,
            @Param("excludeId") Long   excludeId
    );
}
