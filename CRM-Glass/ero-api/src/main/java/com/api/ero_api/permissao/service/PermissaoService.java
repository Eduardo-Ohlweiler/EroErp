package com.api.ero_api.permissao.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.compartilhado.exception.AcessoNegadoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.permissao.dtos.CatalogoGrupoDto;
import com.api.ero_api.permissao.dtos.LiberacaoItemDto;
import com.api.ero_api.permissao.dtos.LiberacoesResponseDto;
import com.api.ero_api.permissao.dtos.LiberacoesUpdateDto;
import com.api.ero_api.permissao.enums.Acao;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.permissao.enums.NivelAcesso;
import com.api.ero_api.permissao.mapper.PermissaoMapper;
import com.api.ero_api.permissao.repository.UsuarioAcaoRepository;
import com.api.ero_api.permissao.repository.UsuarioLiberacaoRepository;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoCache;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import com.api.ero_api.usuario.service.UsuarioService;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grupos de liberação: catálogo, consulta e alteração das permissões de um usuário.
 * O cálculo das authorities fica no {@link CalculoPermissaoService}.
 */
@Service
public class PermissaoService {

    private final UsuarioLiberacaoRepository liberacaoRepository;
    private final UsuarioAcaoRepository acaoRepository;
    private final UsuarioService usuarioService;
    private final CalculoPermissaoService calculoPermissao;
    private final AutorizacaoCache cache;
    private final EventoSegurancaService eventos;

    public PermissaoService(UsuarioLiberacaoRepository liberacaoRepository, UsuarioAcaoRepository acaoRepository,
                            UsuarioService usuarioService, CalculoPermissaoService calculoPermissao,
                            AutorizacaoCache cache, EventoSegurancaService eventos) {
        this.liberacaoRepository = liberacaoRepository;
        this.acaoRepository = acaoRepository;
        this.usuarioService = usuarioService;
        this.calculoPermissao = calculoPermissao;
        this.cache = cache;
        this.eventos = eventos;
    }

    public List<CatalogoGrupoDto> catalogo() {
        return Arrays.stream(GrupoLiberacao.values()).map(PermissaoMapper::toCatalogoDto).toList();
    }

    @Transactional(readOnly = true)
    public LiberacoesResponseDto buscarDoUsuario(UUID usuarioId) {
        return montarResposta(usuarioService.buscarEntidade(usuarioId));
    }

    /**
     * Substitui tudo. Regras (evitam escalada de privilégio — OWASP A01):
     * <ul>
     *   <li>ninguém altera as próprias permissões;</li>
     *   <li>ADMIN/SUPERADMIN não têm lista (já têm tudo);</li>
     *   <li>ação só com o grupo dela liberado;</li>
     *   <li>quem não é administrador só concede o que ele mesmo tem;</li>
     *   <li>{@code version} é a do usuário: duas telas abertas não se sobrescrevem (409).</li>
     * </ul>
     */
    @Transactional
    public LiberacoesResponseDto substituir(UUID usuarioId, LiberacoesUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        Usuario alvo = usuarioService.buscarEntidade(usuarioId);

        if (alvo.getId().equals(eu.usuarioId())) {
            throw new AcessoNegadoException("Você não pode alterar as próprias permissões.");
        }
        if (alvo.getPapel() != Papel.USUARIO) {
            throw new RegraNegocioException("Administradores já têm acesso a tudo; não há o que liberar.");
        }
        if (!alvo.getVersion().equals(dto.version())) {
            throw new ConflitoException("As permissões deste usuário foram alteradas por outra pessoa. Recarregue e tente de novo.");
        }

        Map<GrupoLiberacao, NivelAcesso> grupos = dto.liberacoes().stream()
                .collect(Collectors.toMap(LiberacaoItemDto::grupo, LiberacaoItemDto::nivel, (a, b) -> {
                    throw new RegraNegocioException("Grupo repetido na lista de liberações.");
                }));
        for (Acao acao : dto.acoes()) {
            GrupoLiberacao grupo = GrupoLiberacao.daAcao(acao).orElseThrow();
            if (!grupos.containsKey(grupo)) {
                throw new RegraNegocioException("A ação \"" + acao.rotulo() + "\" exige o grupo " + grupo.rotulo() + " liberado.");
            }
        }
        if (eu.papel() == Papel.USUARIO) {
            // Também não mexe em quem já tem acesso que ele não tem (tirar acesso também é poder).
            if (!eu.authorities().containsAll(calculoPermissao.calcular(alvo))) {
                throw new AcessoNegadoException("Você não pode alterar um usuário que tem acessos que você não tem.");
            }
            Set<String> concedendo = CalculoPermissaoService.authoritiesDe(grupos, dto.acoes());
            if (!eu.authorities().containsAll(concedendo)) {
                throw new AcessoNegadoException("Você só pode liberar acessos que você mesmo tem.");
            }
        }

        liberacaoRepository.deleteAll(liberacaoRepository.buscarDoUsuario(alvo.getId()));
        acaoRepository.deleteAll(acaoRepository.buscarDoUsuario(alvo.getId()));
        liberacaoRepository.flush();
        acaoRepository.flush();
        grupos.forEach((g, n) -> liberacaoRepository.save(PermissaoMapper.toEntity(alvo.getId(), g, n)));
        dto.acoes().forEach(a -> acaoRepository.save(PermissaoMapper.toEntity(alvo.getId(), a)));
        Usuario atualizado = usuarioService.registrarAlteracao(alvo.getId(), dto.version());

        cache.invalidarUsuario(alvo.getId());
        eventos.registrar(TipoEventoSeguranca.PERMISSOES_ALTERADAS, alvo.getId(), alvo.getTenantId(),
                "grupos=" + grupos + " acoes=" + dto.acoes());
        return montarResposta(atualizado);
    }

    private LiberacoesResponseDto montarResposta(Usuario u) {
        return PermissaoMapper.toResponseDto(u, liberacaoRepository.buscarDoUsuario(u.getId()),
                acaoRepository.buscarDoUsuario(u.getId()));
    }
}
