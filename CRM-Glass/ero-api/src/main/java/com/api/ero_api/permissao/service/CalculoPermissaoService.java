package com.api.ero_api.permissao.service;

import com.api.ero_api.permissao.entity.UsuarioAcao;
import com.api.ero_api.permissao.enums.Acao;
import com.api.ero_api.permissao.enums.GrupoLiberacao;
import com.api.ero_api.permissao.enums.NivelAcesso;
import com.api.ero_api.permissao.repository.UsuarioAcaoRepository;
import com.api.ero_api.permissao.repository.UsuarioLiberacaoRepository;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Calcula as authorities de um usuário a partir do papel e das liberações.
 *
 * <p>Separado do PermissaoService para não depender do UsuarioService: assim o
 * próprio UsuarioService pode perguntar "o alvo tem mais acesso do que quem está
 * agindo?" sem criar ciclo entre services.
 */
@Service
public class CalculoPermissaoService {

    private final UsuarioLiberacaoRepository liberacaoRepository;
    private final UsuarioAcaoRepository acaoRepository;

    public CalculoPermissaoService(UsuarioLiberacaoRepository liberacaoRepository, UsuarioAcaoRepository acaoRepository) {
        this.liberacaoRepository = liberacaoRepository;
        this.acaoRepository = acaoRepository;
    }

    /**
     * Authorities efetivas: {@code ROLE_<PAPEL>}, {@code ACESSO_LIBERADO},
     * {@code <GRUPO>_LER}/{@code _ESCREVER} e as ações. ADMIN e SUPERADMIN recebem tudo.
     */
    @Transactional(readOnly = true)
    public Set<String> calcular(Usuario usuario) {
        Set<String> authorities = new LinkedHashSet<>();
        authorities.add("ROLE_" + usuario.getPapel().name());
        authorities.add(UsuarioAutenticado.ACESSO_LIBERADO);
        if (usuario.getPapel() == Papel.SUPERADMIN || usuario.getPapel() == Papel.ADMIN) {
            Map<GrupoLiberacao, NivelAcesso> todos = new EnumMap<>(GrupoLiberacao.class);
            for (GrupoLiberacao g : GrupoLiberacao.values()) {
                todos.put(g, NivelAcesso.ESCREVER);
            }
            authorities.addAll(authoritiesDe(todos, EnumSet.allOf(Acao.class)));
            return authorities;
        }
        Map<GrupoLiberacao, NivelAcesso> grupos = new EnumMap<>(GrupoLiberacao.class);
        liberacaoRepository.buscarDoUsuario(usuario.getId()).forEach(l -> grupos.put(l.getGrupo(), l.getNivel()));
        Set<Acao> acoes = acaoRepository.buscarDoUsuario(usuario.getId()).stream()
                .map(UsuarioAcao::getAcao)
                .filter(a -> grupos.containsKey(GrupoLiberacao.daAcao(a).orElseThrow()))
                .collect(Collectors.toSet());
        authorities.addAll(authoritiesDe(grupos, acoes));
        return authorities;
    }

    /** Authorities que um conjunto de liberações concede (sem papel). */
    public static Set<String> authoritiesDe(Map<GrupoLiberacao, NivelAcesso> grupos, Set<Acao> acoes) {
        Set<String> a = new LinkedHashSet<>();
        grupos.forEach((g, n) -> {
            a.add(g.authorityLer());
            if (n == NivelAcesso.ESCREVER) {
                a.add(g.authorityEscrever());
            }
        });
        acoes.forEach(x -> a.add(x.authority()));
        return a;
    }
}
