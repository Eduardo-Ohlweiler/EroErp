package com.api.ero_api.auxiliar.repository;

import com.api.ero_api.auxiliar.entity.EstadoCivil;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de estado civil. O filtro de tenant é automático em todo JPQL. */
public interface EstadoCivilRepository extends JpaRepository<EstadoCivil, UUID> {

    @Query("""
            SELECT t FROM EstadoCivil t
            WHERE t.id = :id
            """)
    Optional<EstadoCivil> buscarPorId(@Param("id") UUID id);

    /** Grade da tela FormList: ativos e inativos, sem filtro. A ordem vem do {@code Pageable}. */
    @Query(value = """
            SELECT t FROM EstadoCivil t
            """, countQuery = """
            SELECT COUNT(t) FROM EstadoCivil t
            """)
    Page<EstadoCivil> buscarPagina(Pageable pageable);

    /** Combos: só os ativos, ou também os inativos. */
    @Query("""
            SELECT t FROM EstadoCivil t
            WHERE (:inativos = true OR t.ativo = true)
            ORDER BY t.nome
            """)
    List<EstadoCivil> buscarParaSelecao(@Param("inativos") boolean inativos);

    /** Vários de uma vez (o escolhido na pessoa). Id de outro contratante não volta. */
    @Query("""
            SELECT t FROM EstadoCivil t
            WHERE t.id IN :ids
            """)
    List<EstadoCivil> buscarPorIds(@Param("ids") Collection<UUID> ids);

    /** Nome já usado no contratante (contando os do sistema), fora o próprio registro. */
    @Query("""
            SELECT COUNT(t) > 0 FROM EstadoCivil t
            WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId
            """)
    boolean existeNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(t.codEstadoCivil), 0) + 1 FROM EstadoCivil t
            """)
    long buscarProximoCodigo();
}
