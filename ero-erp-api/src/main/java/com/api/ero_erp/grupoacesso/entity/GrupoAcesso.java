package com.api.ero_erp.grupoacesso.entity;

import com.api.ero_erp.role.entity.Role;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "grupo_acesso")
public class GrupoAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "descricao", nullable = true, length = 255)
    private String descricao;

    @ManyToMany
    @JoinTable(
            name = "grupo_acesso_role",
            joinColumns = @JoinColumn(name = "grupo_acesso_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    @Override
    public boolean equals(Object o) {
        if(this == o) return true;
        if (!(o instanceof GrupoAcesso grupo)) return false;
        return id != null && id.equals(grupo.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
