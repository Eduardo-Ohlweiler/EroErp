package com.api.ero_api.permissao.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.permissao.enums.Acao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Uma ação extra concedida a um usuário. */
@Entity
@Table(name = "usuario_acao")
@Getter
@Setter
@NoArgsConstructor
public class UsuarioAcao extends TenantEntity {

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "acao", nullable = false, length = 80)
    private Acao acao;
}
