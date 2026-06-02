package com.api.ero_erp.unidademedida.repository;

import com.api.ero_erp.unidademedida.entity.UnidadeMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnidadeMedidaRepository extends JpaRepository<UnidadeMedida, Long> {

    @Query("""
            SELECT u FROM UnidadeMedida u
            WHERE u.ativo = true
            AND (:busca IS NULL OR LOWER(u.sigla) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                 OR LOWER(u.descricao) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
            ORDER BY u.sigla
            """)
    List<UnidadeMedida> findAtivas(@Param("busca") String busca);
}
