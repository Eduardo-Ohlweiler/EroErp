package com.api.ero_api.auxiliar.repository;

import com.api.ero_api.auxiliar.entity.CategoriaServico;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de categoria de serviço. O filtro de tenant é automático em todo JPQL. */
public interface CategoriaServicoRepository extends JpaRepository<CategoriaServico, UUID> {

    @Query("""
            SELECT t FROM CategoriaServico t
            WHERE t.id = :id
            """)
    Optional<CategoriaServico> buscarPorId(@Param("id") UUID id);

    /** Grade da tela FormList: ativos e inativos, sem filtro. A ordem vem do {@code Pageable}. */
    @Query(value = """
            SELECT t FROM CategoriaServico t
            """, countQuery = """
            SELECT COUNT(t) FROM CategoriaServico t
            """)
    Page<CategoriaServico> buscarPagina(Pageable pageable);

    /** Combos: só as ativas, ou também as inativas. */
    @Query("""
            SELECT t FROM CategoriaServico t
            WHERE (:inativos = true OR t.ativo = true)
            ORDER BY t.nome
            """)
    List<CategoriaServico> buscarParaSelecao(@Param("inativos") boolean inativos);

    /** Vários de uma vez (a escolhida no serviço). Id de outro contratante não volta. */
    @Query("""
            SELECT t FROM CategoriaServico t
            WHERE t.id IN :ids
            """)
    List<CategoriaServico> buscarPorIds(@Param("ids") Collection<UUID> ids);

    /** Nome já usado no contratante, fora o próprio registro. */
    @Query("""
            SELECT COUNT(t) > 0 FROM CategoriaServico t
            WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId
            """)
    boolean existeNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(t.codCategoriaServico), 0) + 1 FROM CategoriaServico t
            """)
    long buscarProximoCodigo();
}
