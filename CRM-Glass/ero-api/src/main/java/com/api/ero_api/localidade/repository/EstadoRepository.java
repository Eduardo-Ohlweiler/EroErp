package com.api.ero_api.localidade.repository;

import com.api.ero_api.localidade.entity.Estado;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de estado (dado de referência do IBGE, sem tenant): as 27 UFs. */
public interface EstadoRepository extends JpaRepository<Estado, UUID> {

    /** As 27 UFs, por sigla (o combo da UF do RG). */
    @Query("""
            SELECT e FROM Estado e
            ORDER BY e.sigla
            """)
    List<Estado> buscarTodos();

    @Query("""
            SELECT e FROM Estado e
            WHERE e.id = :id
            """)
    Optional<Estado> buscarPorId(@Param("id") UUID id);
}
