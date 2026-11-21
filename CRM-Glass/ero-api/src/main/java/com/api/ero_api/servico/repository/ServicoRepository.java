package com.api.ero_api.servico.repository;

import com.api.ero_api.servico.entity.Servico;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Consultas de serviço. O filtro de tenant é automático em todo JPQL (inclusive no EXISTS). */
public interface ServicoRepository extends JpaRepository<Servico, UUID> {

    /** Ficha: o serviço e a categoria numa consulta só (as filiais vêm do {@code ServicoFilialRepository}). */
    @Query("""
            SELECT s FROM Servico s
            LEFT JOIN FETCH s.categoria
            WHERE s.id = :id
            """)
    Optional<Servico> buscarPorId(@Param("id") UUID id);

    /**
     * Lista com filtros (todos opcionais; o service já normalizou). {@code busca}: parte do
     * nome, sem acento e sem caixa ({@code nome_busca}). {@code filialId}: só os serviços
     * prestados nesta filial. A ordem vem do {@code Pageable} (lista branca no service). A
     * contagem é explícita e sem fetch (com {@code JOIN FETCH} o Spring não sabe derivá-la).
     */
    @Query(value = """
            SELECT s FROM Servico s
            LEFT JOIN FETCH s.categoria c
            WHERE (:codServico IS NULL OR s.codServico = :codServico)
              AND (:busca IS NULL OR s.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:categoriaId IS NULL OR c.id = :categoriaId)
              AND (:filialId IS NULL OR EXISTS (
                    SELECT 1 FROM ServicoFilial sf
                    WHERE sf.servico = s AND sf.filial.id = :filialId))
              AND (:ativo IS NULL OR s.ativo = :ativo)
            """,
            countQuery = """
            SELECT COUNT(s) FROM Servico s
            WHERE (:codServico IS NULL OR s.codServico = :codServico)
              AND (:busca IS NULL OR s.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:categoriaId IS NULL OR s.categoria.id = :categoriaId)
              AND (:filialId IS NULL OR EXISTS (
                    SELECT 1 FROM ServicoFilial sf
                    WHERE sf.servico = s AND sf.filial.id = :filialId))
              AND (:ativo IS NULL OR s.ativo = :ativo)
            """)
    Page<Servico> buscarComFiltros(@Param("codServico") Long codServico, @Param("busca") String busca,
                                   @Param("categoriaId") UUID categoriaId, @Param("filialId") UUID filialId,
                                   @Param("ativo") Boolean ativo, Pageable pageable);

    /** Combo de serviços: só os ativos, por nome. {@code busca} já normalizada; o {@code limite} corta a lista. */
    @Query("""
            SELECT s FROM Servico s
            WHERE s.ativo = true
              AND (:busca IS NULL OR s.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
            ORDER BY s.nome
            """)
    List<Servico> buscarParaSelecao(@Param("busca") String busca, Pageable limite);

    /** Código do serviço que já usa o nome (fora o próprio), para o 409 dizer qual. */
    @Query("""
            SELECT s.codServico FROM Servico s
            WHERE s.nomeBusca = :nomeBusca AND s.id <> :ignorarId
            """)
    Optional<Long> buscarCodigoPorNome(@Param("nomeBusca") String nomeBusca, @Param("ignorarId") UUID ignorarId);

    /** Próximo código do contratante. Nunca em contexto ROOT (pegaria o maior de todos os contratantes). */
    @Query("""
            SELECT COALESCE(MAX(s.codServico), 0) + 1 FROM Servico s
            """)
    long buscarProximoCodigo();

    /**
     * Registra que algo do serviço mudou (inclusive só as filiais): confere a versão e
     * incrementa num comando só, com a linha já travada. 0 linhas = outro usuário alterou antes.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE VERSIONED Servico s
            SET s.updatedAt = :agora, s.updatedBy = :autor
            WHERE s.id = :id AND s.version = :versao
            """)
    int marcarAlteracao(@Param("id") UUID id, @Param("versao") Long versao,
                        @Param("agora") Instant agora, @Param("autor") UUID autor);
}
