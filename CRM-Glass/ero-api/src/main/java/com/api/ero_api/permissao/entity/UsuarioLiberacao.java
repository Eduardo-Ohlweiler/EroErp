package com.api.ero_api.permissao.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.permissao.enums.NivelAcesso;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Um grupo liberado para um usuário, com o nível (LER ou ESCREVER). */
@Entity
@Table(name = "usuario_liberacao")
@Getter
@Setter
@NoArgsConstructor
public class UsuarioLiberacao extends TenantEntity {

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "grupo", nullable = false, length = 60)
    private GrupoLiberacao grupo;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel", nullable = false, length = 20)
    private NivelAcesso nivel;
}
