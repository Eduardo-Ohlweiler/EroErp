package com.api.ero_erp.permissao.repository;

import com.api.ero_erp.permissao.entity.UsuarioPermissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UsuarioPermissaoRepository extends JpaRepository<UsuarioPermissao, UUID> {

    /** Sempre pelo par usuário + tenant: permissão de outro cliente não aparece. */
    List<UsuarioPermissao> findAllByUsuarioIdAndTenantId(UUID usuarioId, UUID tenantId);
}
