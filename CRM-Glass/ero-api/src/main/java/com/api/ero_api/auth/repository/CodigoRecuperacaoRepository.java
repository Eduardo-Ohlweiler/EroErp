package com.api.ero_api.auth.repository;

import com.api.ero_api.auth.entity.CodigoRecuperacao;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CodigoRecuperacaoRepository extends JpaRepository<CodigoRecuperacao, UUID> {

    @Query("""
            SELECT c FROM CodigoRecuperacao c
            WHERE c.usuarioId = :usuarioId
            """)
    List<CodigoRecuperacao> buscarDoUsuario(@Param("usuarioId") UUID usuarioId);

    @Query("""
            SELECT c FROM CodigoRecuperacao c
            WHERE c.usuarioId = :usuarioId
              AND c.codigoHash = :hash
              AND c.usadoEm IS NULL
            """)
    Optional<CodigoRecuperacao> buscarNaoUsado(@Param("usuarioId") UUID usuarioId, @Param("hash") String hash);
}
