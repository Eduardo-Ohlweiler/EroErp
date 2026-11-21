package com.api.ero_api.filial.repository;

import com.api.ero_api.filial.entity.Filial;
import com.api.ero_api.filial.enums.TipoFilial;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de filial. O filtro de tenant é automático em todo JPQL. */
public interface FilialRepository extends JpaRepository<Filial, UUID> {

    /** Ficha: a pessoa, a matriz e a pessoa da matriz numa consulta só. */
    @Query("""
            SELECT f FROM Filial f
            JOIN FETCH f.pessoa
            LEFT JOIN FETCH f.matriz m
            LEFT JOIN FETCH m.pessoa
            WHERE f.id = :id
            """)
    Optional<Filial> buscarPorId(@Param("id") UUID id);

    /**
     * Lista com filtros (todos opcionais; o service já normalizou), em ordem fixa e agrupada:
     * cada matriz seguida das suas filiais, as matrizes por nome. {@code busca}: parte do
     * nome ou da fantasia da pessoa, sem acento e sem caixa ({@code nome_busca}).
     * {@code documento}: parte do CPF ou do CNPJ, sem máscara. A contagem é explícita e sem
     * fetch (com {@code JOIN FETCH} o Spring não sabe derivá-la).
     */
    @Query(value = """
            SELECT f FROM Filial f
            JOIN FETCH f.pessoa p
            LEFT JOIN FETCH f.matriz m
            LEFT JOIN FETCH m.pessoa mp
            WHERE (:codFilial IS NULL OR f.codFilial = :codFilial)
              AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:documento IS NULL
                   OR p.cpf LIKE CONCAT('%', CAST(:documento AS string), '%')
                   OR p.cnpj LIKE CONCAT('%', CAST(:documento AS string), '%'))
              AND (:tipo IS NULL OR f.tipo = :tipo)
              AND (:ativo IS NULL OR f.ativo = :ativo)
            ORDER BY COALESCE(mp.nome, p.nome), COALESCE(m.id, f.id),
                     CASE WHEN m.id IS NULL THEN 0 ELSE 1 END, p.nome, f.id
            """,
            countQuery = """
            SELECT COUNT(f) FROM Filial f
            JOIN f.pessoa p
            WHERE (:codFilial IS NULL OR f.codFilial = :codFilial)
              AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:documento IS NULL
                   OR p.cpf LIKE CONCAT('%', CAST(:documento AS string), '%')
                   OR p.cnpj LIKE CONCAT('%', CAST(:documento AS string), '%'))
              AND (:tipo IS NULL OR f.tipo = :tipo)
              AND (:ativo IS NULL OR f.ativo = :ativo)
            """)
    Page<Filial> buscarComFiltros(@Param("codFilial") Long codFilial, @Param("busca") String busca,
                                  @Param("documento") String documento, @Param("tipo") TipoFilial tipo,
                                  @Param("ativo") Boolean ativo, Pageable pageable);

    /**
     * Combo de filiais: só as ativas, por nome da pessoa. {@code busca} já normalizada;
     * {@code tipo} restringe (MATRIZ no combo de matriz); {@code ignorarId} tira a própria.
     * O {@code limite} corta a lista.
     */
    @Query("""
            SELECT f FROM Filial f
            JOIN FETCH f.pessoa p
            WHERE f.ativo = true
              AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:tipo IS NULL OR f.tipo = :tipo)
              AND (:ignorarId IS NULL OR f.id <> :ignorarId)
            ORDER BY p.nome
            """)
    List<Filial> buscarParaSelecao(@Param("busca") String busca, @Param("tipo") TipoFilial tipo,
                                   @Param("ignorarId") UUID ignorarId, Pageable limite);

    /**
     * Trava as filiais (SELECT ... FOR UPDATE) em ordem de id: criar uma filial em M,
     * inativar M e transformar M em filial travam a linha de M antes de conferir, sempre na
     * mesma ordem (sem deadlock). Sem fetch: o PostgreSQL recusa {@code FOR UPDATE} no lado
     * nulo de um outer join. Id de outro contratante não volta.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT f FROM Filial f
            WHERE f.id IN :ids
            ORDER BY f.id
            """)
    List<Filial> travarPorIds(@Param("ids") Collection<UUID> ids);

    /** A matriz gravada da filial, sem carregar a entidade (para travar as duas em ordem de id). */
    @Query("""
            SELECT f.matriz.id FROM Filial f
            WHERE f.id = :id
            """)
    Optional<UUID> buscarMatrizId(@Param("id") UUID id);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(f.codFilial), 0) + 1 FROM Filial f
            """)
    long buscarProximoCodigo();

    /** Código da filial que já usa a pessoa (fora a própria), para o 409 dizer qual. */
    @Query("""
            SELECT f.codFilial FROM Filial f
            WHERE f.pessoa.id = :pessoaId AND f.id <> :ignorarId
            """)
    Optional<Long> buscarCodigoPorPessoa(@Param("pessoaId") UUID pessoaId, @Param("ignorarId") UUID ignorarId);

    @Query("""
            SELECT COUNT(f) FROM Filial f
            WHERE f.matriz.id = :matrizId
            """)
    long contarFilhas(@Param("matrizId") UUID matrizId);

    @Query("""
            SELECT COUNT(f) FROM Filial f
            WHERE f.matriz.id = :matrizId AND f.ativo = true
            """)
    long contarFilhasAtivas(@Param("matrizId") UUID matrizId);
}
