package com.api.ero_api.seguranca.autorizacao;

import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.permissao.service.CalculoPermissaoService;
import com.api.ero_api.seguranca.config.SegurancaProperties;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.UsuarioAutenticado.Pendencia;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.sessao.entity.SessaoUsuario;
import com.api.ero_api.sessao.service.SessaoService;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.service.TenantService;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Monta o {@link UsuarioAutenticado} de uma requisição: confere no banco que a
 * sessão está ativa, que o usuário e o contratante estão ativos, que o tenant do
 * token bate com a sessão, e calcula as permissões. Fica 30 s em cache.
 *
 * <p>Roda em contexto ROOT porque ainda não sabemos o tenant (e o superadmin
 * pertence à Plataforma mesmo atuando em outro contratante). É seguro: toda
 * busca aqui é pelo id que veio do token assinado.
 */
@Service
public class AutorizacaoService {

    private final UsuarioService usuarioService;
    private final TenantService tenantService;
    private final SessaoService sessaoService;
    private final CalculoPermissaoService calculoPermissao;
    private final boolean superadminExige2fa;
    private final AutorizacaoCache cache;
    private final TransactionTemplate leitura;

    public AutorizacaoService(UsuarioService usuarioService, TenantService tenantService, SessaoService sessaoService,
                              CalculoPermissaoService calculoPermissao, AutorizacaoCache cache, SegurancaProperties props,
                              PlatformTransactionManager transactionManager) {
        this.usuarioService = usuarioService;
        this.tenantService = tenantService;
        this.sessaoService = sessaoService;
        this.calculoPermissao = calculoPermissao;
        this.superadminExige2fa = props.superadminExige2fa();
        this.cache = cache;
        this.leitura = new TransactionTemplate(transactionManager);
        this.leitura.setReadOnly(true);
    }

    /** @throws InvalidBearerTokenException (401) se a sessão não vale mais */
    public UsuarioAutenticado carregar(UUID usuarioId, UUID sessaoId, UUID tenantDoToken) {
        UsuarioAutenticado u = cache.obter(sessaoId,
                sid -> TenantContext.comoRoot(() -> leitura.execute(s -> montar(usuarioId, sid))));
        if (!u.usuarioId().equals(usuarioId) || !u.tenantId().equals(tenantDoToken)) {
            // Token antigo (ex.: superadmin trocou de contratante) ou forjado com outra sessão.
            throw invalido();
        }
        return u;
    }

    private UsuarioAutenticado montar(UUID usuarioId, UUID sessaoId) {
        SessaoUsuario sessao = sessaoService.buscarAtiva(sessaoId).orElseThrow(AutorizacaoService::invalido);
        if (!sessao.getUsuarioId().equals(usuarioId)) {
            throw invalido();
        }
        Usuario usuario;
        try {
            usuario = usuarioService.buscarEntidade(usuarioId);
        } catch (NaoEncontradoException e) {
            throw invalido();
        }
        if (!usuario.isAtivo()) {
            throw invalido();
        }
        UUID tenantEfetivo = sessao.tenantEfetivo();
        boolean superadmin = usuario.getPapel() == Papel.SUPERADMIN;
        if (!superadmin && !usuario.getTenantId().equals(tenantEfetivo)) {
            throw invalido();
        }
        Tenant tenantDoUsuario = tenantService.buscarEntidade(usuario.getTenantId());
        if (!superadmin && !tenantDoUsuario.isAtivo()) {
            throw invalido();
        }

        Pendencia pendencia = Pendencia.NENHUMA;
        if (usuario.isExigirTrocaSenha()) {
            pendencia = Pendencia.TROCAR_SENHA;
        } else if (!usuario.isTotpAtivo() && (tenantDoUsuario.isExige2fa() || (superadmin && superadminExige2fa))) {
            pendencia = Pendencia.CONFIGURAR_2FA;
        }
        Set<String> authorities = pendencia == Pendencia.NENHUMA
                ? calculoPermissao.calcular(usuario)
                : Set.of("PENDENCIA_" + pendencia.name());

        return new UsuarioAutenticado(usuario.getId(), tenantEfetivo, sessaoId, usuario.getNome(), usuario.getEmail(),
                usuario.getPapel(), pendencia, authorities);
    }

    private static InvalidBearerTokenException invalido() {
        return new InvalidBearerTokenException("Sessão inválida ou expirada.");
    }
}
