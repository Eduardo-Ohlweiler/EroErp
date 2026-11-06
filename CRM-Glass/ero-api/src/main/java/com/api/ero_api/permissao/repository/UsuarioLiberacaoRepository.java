package com.api.ero_api.permissao.repository;

import com.api.ero_api.permissao.entity.UsuarioLiberacao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioLiberacaoRepository extends JpaRepository<UsuarioLiberacao, UUID> {

    @Query("""
            SELECT l FROM UsuarioLiberacao l
            WHERE l.usuarioId = :usuarioId
            ORDER BY l.grupo
            """)
    List<UsuarioLiberacao> buscarDoUsuario(@Param("usuarioId") UUID usuarioId);
}
