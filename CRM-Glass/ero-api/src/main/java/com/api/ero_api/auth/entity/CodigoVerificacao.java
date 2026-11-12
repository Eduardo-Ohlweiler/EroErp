package com.api.ero_api.auth.entity;

import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.api.ero_api.seguranca.cripto.CriptoConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Código de 6 dígitos enviado por e-mail depois da senha certa (segunda etapa do login).
 *
 * <p>Vale {@code app.seguranca.desafio2fa} (10 min) a partir do 1º envio. O
 * "reenviar" manda o MESMO código sem estender a validade; por isso ele fica
 * cifrado (AES-GCM) e não em hash. Uso único: {@code usadoEm} preenchido = gasto.
 * Login novo e bloqueio da conta apagam as linhas do usuário; troca de senha as
 * invalida pela data (ver {@link #valeEm}). As vencidas e usadas somem no job diário.
 */
@Entity
@Table(name = "codigo_verificacao")
@Getter
@Setter
@NoArgsConstructor
public class CodigoVerificacao extends TenantEntity {

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    /** jti do desafio JWT que o front recebeu: é por ele que o código é achado. */
    @Column(name = "desafio_jti", nullable = false, updatable = false)
    private UUID desafioJti;

    @Convert(converter = CriptoConverter.class)
    @Column(name = "codigo", nullable = false, length = 100, updatable = false)
    private String codigo;

    @Column(name = "expira_em", nullable = false, updatable = false)
    private Instant expiraEm;

    @Column(name = "ultimo_envio_em", nullable = false)
    private Instant ultimoEnvioEm;

    @Column(name = "envios", nullable = false)
    private int envios;

    @Column(name = "usado_em")
    private Instant usadoEm;

    /**
     * Ainda serve para entrar: não foi usado, não venceu e foi emitido DEPOIS da
     * última troca de senha do usuário. Trocar ou redefinir a senha derruba o código
     * pendente: quem tinha a senha antiga não termina o login com ele.
     */
    public boolean valeEm(Instant momento, Instant senhaAlteradaEm) {
        boolean anteriorASenha = senhaAlteradaEm != null && !getCreatedAt().isAfter(senhaAlteradaEm);
        return usadoEm == null && expiraEm.isAfter(momento) && !anteriorASenha;
    }
}
