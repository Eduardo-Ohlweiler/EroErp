package com.api.ero_api.auxiliar.repository;

import com.api.ero_api.auxiliar.entity.Profissao;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de profissão. O filtro de tenant é automático em todo JPQL. */
public interface ProfissaoRepository extends JpaRepository<Profissao, UUID> {

    @Query("""
            SELECT t FROM Profissao t
            WHERE t.id = :id
            """)
    Optional<Profissao> buscarPorId(@Param("id") UUID id);

    /** Grade da tela FormList: ativos e inativos, sem filtro. A ordem vem do {@code Pageable}. */
    @Query(value = """
            SELECT t FROM Profissao t
            """, countQuery = """
            SELECT COUNT(t) FROM Profissao t
            """)
    Page<Profissao> buscarPagina(Pageable pageable);

    /** Combos: só os ativos, ou também os inativos. */
    @Query("""
            SELECT t FROM Profissao t
            WHERE (:inativos = true OR t.ativo = true)
            ORDER BY t.nome
            """)
    List<Profissao> buscarParaSelecao(@Param("inativos") boolean inativos);

    /** Vários de uma vez (o escolhido na pessoa). Id de outro contratante não volta. */
    @Query("""
            SELECT t FROM Profissao t
            WHERE t.id IN :ids
            """)
    List<Profissao> buscarPorIds(@Param("ids") Collection<UUID> ids);

    /** Nome já usado no contratante (contando os do sistema), fora o próprio registro. */
    @Query("""
            SELECT COUNT(t) > 0 FROM Profissao t
            WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId
            """)
    boolean existeNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(t.codProfissao), 0) + 1 FROM Profissao t
            """)
    long buscarProximoCodigo();
}
