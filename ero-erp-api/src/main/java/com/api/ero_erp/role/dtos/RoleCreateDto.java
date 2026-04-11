package com.api.ero_erp.role.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RoleCreateDto {

    @NotBlank(message = "O nome do artista é obrigatório")
    @Size(max = 100, message = "O nome do role deve ter no máximo 100 caracteres")
    @Schema(description = "Nome do role", example = "ADMIN")
    private String nome;

    @Size(max = 255, message = "A descrição do role deve ter no máximo 255 caracteres")
    @Schema(description = "Descrição do role", example = "Role para usuários do sistema com acesso total de informações e funcionalidades")
    private String descricao;

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
}
