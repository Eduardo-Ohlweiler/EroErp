package com.api.ero_api.auxiliar.repository;

import com.api.ero_api.auxiliar.entity.TipoEmail;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de tipo de e-mail. O filtro de tenant é automático em todo JPQL. */
public interface TipoEmailRepository extends JpaRepository<TipoEmail, UUID> {

    @Query("""
            SELECT t FROM TipoEmail t
            WHERE t.id = :id
            """)
    Optional<TipoEmail> buscarPorId(@Param("id") UUID id);

    /** Grade da tela FormList: ativos e inativos, sem filtro. A ordem vem do {@code Pageable}. */
    @Query(value = """
            SELECT t FROM TipoEmail t
            """, countQuery = """
            SELECT COUNT(t) FROM TipoEmail t
            """)
    Page<TipoEmail> buscarPagina(Pageable pageable);

    /** Combos: só os ativos, ou também os inativos. */
    @Query("""
            SELECT t FROM TipoEmail t
            WHERE (:inativos = true OR t.ativo = true)
            ORDER BY t.nome
            """)
    List<TipoEmail> buscarParaSelecao(@Param("inativos") boolean inativos);

    /** Vários de uma vez (tipos escolhidos na pessoa). Id de outro contratante não volta. */
    @Query("""
            SELECT t FROM TipoEmail t
            WHERE t.id IN :ids
            """)
    List<TipoEmail> buscarPorIds(@Param("ids") Collection<UUID> ids);

    /** Nome já usado no contratante (contando os do sistema), fora o próprio registro. */
    @Query("""
            SELECT COUNT(t) > 0 FROM TipoEmail t
            WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId
            """)
    boolean existeNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(t.codTipoEmail), 0) + 1 FROM TipoEmail t
            """)
    long buscarProximoCodigo();
}
