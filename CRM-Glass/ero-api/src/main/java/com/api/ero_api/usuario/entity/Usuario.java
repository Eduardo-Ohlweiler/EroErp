package com.api.ero_api.usuario.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.seguranca.cripto.CriptoConverter;
import com.api.ero_api.usuario.enums.Papel;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;

/**
 * Usuário de um contratante.
 *
 * <p>Os campos de controle de acesso ({@code tentativasFalhas}, {@code bloqueadoAte},
 * {@code ultimoLoginEm}, {@code totpUltimoPasso}) são gravados só por UPDATE direto
 * no repository (ver {@code UsuarioService.atualizarTentativas} e afins): assim um
 * login não muda a {@code version} nem o "alterado por" do cadastro. Não use os
 * setters deles fora de criação.
 */
@Entity
@Table(name = "usuario")
@DynamicUpdate
@Getter
@Setter
@NoArgsConstructor
public class Usuario extends TenantEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    /** Sempre minúsculo. Único no sistema todo (o login não pede o contratante). */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel", nullable = false, length = 20)
    private Papel papel;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    /** Senha definida por outra pessoa: precisa trocar no próximo acesso. */
    @Column(name = "exigir_troca_senha", nullable = false)
    private boolean exigirTrocaSenha;

    @Column(name = "senha_alterada_em")
    private Instant senhaAlteradaEm;

    @Column(name = "tentativas_falhas", nullable = false)
    private int tentativasFalhas;

    @Column(name = "bloqueado_ate")
    private Instant bloqueadoAte;

    @Column(name = "ultimo_login_em")
    private Instant ultimoLoginEm;

    /** Segredo TOTP cifrado (AES-GCM). Preenchido ao iniciar a configuração do 2FA. */
    @Convert(converter = CriptoConverter.class)
    @Column(name = "totp_segredo", length = 255)
    private String totpSegredo;

    @Column(name = "totp_ativo", nullable = false)
    private boolean totpAtivo;

    /** Último passo de 30 s aceito: impede reutilizar o mesmo código. */
    @Column(name = "totp_ultimo_passo")
    private Long totpUltimoPasso;

    public boolean bloqueadoEm(Instant momento) {
        return bloqueadoAte != null && bloqueadoAte.isAfter(momento);
    }
}
