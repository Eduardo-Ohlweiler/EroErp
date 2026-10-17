package com.api.ero_erp.permissao.entity;

import com.api.ero_erp.baseentity.TenantEntity;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Uma tela liberada para um usuário USER. O {@code tenant_id} repete o do
 * usuário, como nos contatos da pessoa: a consulta filtra pelo par usuário +
 * tenant sem carregar o usuário antes.
 */
@Entity
@Table(name = "usuario_permissao")
@Getter
@Setter
@NoArgsConstructor
public class UsuarioPermissao extends TenantEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tela", nullable = false, length = 40)
    private Tela tela;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel", nullable = false, length = 10)
    private NivelAcesso nivel;
}
