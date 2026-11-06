package com.api.ero_api.tenant.repository;

import com.api.ero_api.tenant.dtos.TenantSelectDto;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.enums.Fundo;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** A "Plataforma" (id zero) nunca aparece nas listas. */
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    @Query("""
            SELECT t FROM Tenant t
            WHERE t.id = :id
            """)
    Optional<Tenant> buscarPorId(@Param("id") UUID id);

    @Query("""
            SELECT t FROM Tenant t
            WHERE t.id <> :plataforma
              AND (:ativo IS NULL OR t.ativo = :ativo)
              AND (:busca IS NULL
                   OR LOWER(t.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR (:buscaDocumento IS NOT NULL
                       AND t.documento LIKE CONCAT('%', CAST(:buscaDocumento AS string), '%')))
            """)
    Page<Tenant> buscarComFiltros(@Param("plataforma") UUID plataforma, @Param("busca") String busca,
                                  @Param("buscaDocumento") String buscaDocumento,
                                  @Param("ativo") Boolean ativo, Pageable pageable);

    @Query("""
            SELECT t FROM Tenant t
            WHERE t.id <> :plataforma AND t.ativo = true
            ORDER BY t.nome
            """)
    List<Tenant> buscarParaSelecao(@Param("plataforma") UUID plataforma);

    @Query("""
            SELECT COUNT(t) > 0 FROM Tenant t
            WHERE t.documento = :documento AND t.id <> :ignorarId
            """)
    boolean existeDocumento(@Param("documento") String documento, @Param("ignorarId") UUID ignorarId);

    /** Nomes de vários contratantes de uma vez (trilha de auditoria: um SELECT por página). */
    @Query("""
            SELECT new com.api.ero_api.tenant.dtos.TenantSelectDto(t.id, t.nome)
            FROM Tenant t
            WHERE t.id IN :ids
            """)
    List<TenantSelectDto> buscarNomesPorIds(@Param("ids") Collection<UUID> ids);

    /** Cenas exclusivas que já têm dono (menos o contratante indicado). */
    @Query("""
            SELECT t.fundoExclusivo FROM Tenant t
            WHERE t.fundoExclusivo IS NOT NULL AND t.id <> :ignorarId
            """)
    List<Fundo> buscarFundosExclusivosEmUso(@Param("ignorarId") UUID ignorarId);

    @Query("""
            SELECT COUNT(t) > 0 FROM Tenant t
            WHERE t.fundoExclusivo = :fundo AND t.id <> :ignorarId
            """)
    boolean existeFundoExclusivo(@Param("fundo") Fundo fundo, @Param("ignorarId") UUID ignorarId);
}
