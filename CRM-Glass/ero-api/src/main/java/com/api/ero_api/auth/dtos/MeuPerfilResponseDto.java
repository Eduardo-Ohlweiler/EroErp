package com.api.ero_api.auth.dtos;

import com.api.ero_api.tenant.enums.TemaInterface;
import com.api.ero_api.usuario.enums.Papel;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * Os meus dados (aba "Meus dados" da Minha conta). Nome e telefone são editáveis em
 * {@code PUT /api/auth/eu/perfil}; e-mail, papel e contratante são só leitura aqui.
 */
@Schema(description = "Meus dados")
public record MeuPerfilResponseDto(
        UUID id,
        String nome,
        @Schema(description = "E-mail de acesso (só o administrador troca: é para onde vai o código do login)") String email,
        @Schema(description = "Telefone com DDD, só dígitos (nulo = não informado)") String telefone,
        Papel papel,
        @Schema(description = "Contratante a que o usuário pertence (\"Plataforma\" para o superadmin, mesmo atuando num contratante)")
        String tenantNome,
        @Schema(description = "Tema escolhido; null = segue o tema padrão do contratante", nullable = true)
        TemaInterface temaPreferido,
        @Schema(description = "Versão, devolvida no PUT") Long version) {
}
