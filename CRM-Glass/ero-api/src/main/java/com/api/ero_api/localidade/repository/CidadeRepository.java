package com.api.ero_api.localidade.repository;

import com.api.ero_api.localidade.entity.Cidade;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Consultas de cidade (dado de referência do IBGE, sem tenant). Sempre com o estado
 * junto ({@code JOIN FETCH}): a resposta leva a sigla da UF.
 */
public interface CidadeRepository extends JpaRepository<Cidade, UUID> {

    /**
     * Combo de cidades. {@code busca} já vem normalizada ({@code TextoBusca}); o
     * {@code limite} corta a lista (o service manda os primeiros 50).
     */
    @Query("""
            SELECT c FROM Cidade c JOIN FETCH c.estado e
            WHERE (:busca IS NULL OR c.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
              AND (:uf IS NULL OR e.sigla = CAST(:uf AS string))
            ORDER BY c.nome
            """)
    List<Cidade> buscarParaSelecao(@Param("busca") String busca, @Param("uf") String uf, Pageable limite);

    /** Várias cidades numa consulta só (endereços de uma pessoa). Id que não existe não volta. */
    @Query("""
            SELECT c FROM Cidade c JOIN FETCH c.estado
            WHERE c.id IN :ids
            """)
    List<Cidade> buscarPorIds(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT c FROM Cidade c JOIN FETCH c.estado
            WHERE c.codigoIbge = :codigoIbge
            """)
    Optional<Cidade> buscarPorCodigoIbge(@Param("codigoIbge") Integer codigoIbge);
}
