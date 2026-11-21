package com.api.ero_api.auxiliar.repository;

import com.api.ero_api.auxiliar.entity.TipoEndereco;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de tipo de endereço. O filtro de tenant é automático em todo JPQL. */
public interface TipoEnderecoRepository extends JpaRepository<TipoEndereco, UUID> {

    @Query("""
            SELECT t FROM TipoEndereco t
            WHERE t.id = :id
            """)
    Optional<TipoEndereco> buscarPorId(@Param("id") UUID id);

    /** Grade da tela FormList: ativos e inativos, sem filtro. A ordem vem do {@code Pageable}. */
    @Query(value = """
            SELECT t FROM TipoEndereco t
            """, countQuery = """
            SELECT COUNT(t) FROM TipoEndereco t
            """)
    Page<TipoEndereco> buscarPagina(Pageable pageable);

    /** Combos: só os ativos, ou também os inativos. */
    @Query("""
            SELECT t FROM TipoEndereco t
            WHERE (:inativos = true OR t.ativo = true)
            ORDER BY t.nome
            """)
    List<TipoEndereco> buscarParaSelecao(@Param("inativos") boolean inativos);

    /** Vários de uma vez (tipos escolhidos na pessoa). Id de outro contratante não volta. */
    @Query("""
            SELECT t FROM TipoEndereco t
            WHERE t.id IN :ids
            """)
    List<TipoEndereco> buscarPorIds(@Param("ids") Collection<UUID> ids);

    /** Nome já usado no contratante (contando os do sistema), fora o próprio registro. */
    @Query("""
            SELECT COUNT(t) > 0 FROM TipoEndereco t
            WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId
            """)
    boolean existeNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(t.codTipoEndereco), 0) + 1 FROM TipoEndereco t
            """)
    long buscarProximoCodigo();
}
