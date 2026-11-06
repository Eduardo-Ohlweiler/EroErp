package com.api.ero_api.permissao.repository;

import com.api.ero_api.permissao.entity.UsuarioAcao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioAcaoRepository extends JpaRepository<UsuarioAcao, UUID> {

    @Query("""
            SELECT a FROM UsuarioAcao a
            WHERE a.usuarioId = :usuarioId
            ORDER BY a.acao
            """)
    List<UsuarioAcao> buscarDoUsuario(@Param("usuarioId") UUID usuarioId);
}
