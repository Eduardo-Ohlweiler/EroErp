package com.api.ero_erp.permissao.service;

import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.permissao.dtos.CatalogoModuloDto;
import com.api.ero_erp.permissao.dtos.PermissaoDto;
import com.api.ero_erp.permissao.entity.UsuarioPermissao;
import com.api.ero_erp.permissao.enums.Modulo;
import com.api.ero_erp.permissao.enums.NivelAcesso;
import com.api.ero_erp.permissao.enums.Tela;
import com.api.ero_erp.permissao.repository.UsuarioPermissaoRepository;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Permissões por tela do usuário USER.
 *
 * <p>ADMIN e SUPERADMIN acessam todas as telas, e essa regra mora só em
 * {@link #efetivas}: o filtro de segurança e a resposta de autenticação leem
 * dali, e o front recebe o mapa já resolvido — não reimplementa o "se é admin".
 *
 * <p>A permissão não viaja no token. O {@code JwtFilter} já recarrega o usuário
 * a cada requisição e chama {@link #authorities}, então mudar uma permissão vale
 * na requisição seguinte, sem novo login.
 */
@Service
@RequiredArgsConstructor
public class PermissaoService {

    private final UsuarioPermissaoRepository repository;

    /** Módulos e telas na ordem dos enums, para a tela de usuário. */
    public List<CatalogoModuloDto> catalogo() {
        return Arrays.stream(Modulo.values())
                .map(modulo -> new CatalogoModuloDto(modulo, modulo.rotulo(),
                        Arrays.stream(Tela.values())
                                .filter(tela -> tela.modulo() == modulo)
                                .map(tela -> new CatalogoModuloDto.TelaDto(tela, tela.rotulo()))
                                .toList()))
                .filter(m -> !m.telas().isEmpty())
                .toList();
    }

    /** O que está gravado para o usuário, na ordem do catálogo. */
    @Transactional(readOnly = true)
    public List<PermissaoDto> listar(Usuario usuario) {
        return gravadas(usuario).stream()
                .sorted(Comparator.comparing(UsuarioPermissao::getTela))
                .map(p -> new PermissaoDto(p.getTela(), p.getNivel()))
                .toList();
    }

    /** Tela → nível que o usuário de fato tem. Tela ausente é sem acesso. */
    @Transactional(readOnly = true)
    public Map<Tela, NivelAcesso> efetivas(Usuario usuario) {
        Map<Tela, NivelAcesso> mapa = new EnumMap<>(Tela.class);

        if (usuario.getRole() != Role.USER) {
            EnumSet.allOf(Tela.class).forEach(tela -> mapa.put(tela, NivelAcesso.ESCRITA));
            return mapa;
        }

        gravadas(usuario).forEach(p -> mapa.put(p.getTela(), p.getNivel()));
        return mapa;
    }

    /** {@code <TELA>_LER} para leitura e escrita; {@code <TELA>_ESCREVER} só para escrita. */
    @Transactional(readOnly = true)
    public List<GrantedAuthority> authorities(Usuario usuario) {
        List<GrantedAuthority> lista = new ArrayList<>();
        efetivas(usuario).forEach((tela, nivel) -> {
            lista.add(new SimpleGrantedAuthority(tela.authorityLer()));
            if (nivel == NivelAcesso.ESCRITA)
                lista.add(new SimpleGrantedAuthority(tela.authorityEscrever()));
        });
        return lista;
    }

    /**
     * Grava a lista recebida como o <b>estado completo</b>: tela que veio
     * nasce ou muda de nível, tela que não veio perde o acesso.
     *
     * <p>Fora do nível USER a lista é ignorada e o que houver é apagado: um
     * ADMIN rebaixado não pode reaparecer com permissões esquecidas de antes.
     *
     * <p>Atualiza no lugar em vez de apagar e reinserir: o Hibernate executa os
     * INSERT antes dos DELETE no flush, e a mesma tela reinserida bateria na
     * {@code uk_usuario_permissao_tela}.
     */
    @Transactional
    public List<PermissaoDto> sincronizar(Usuario usuario, List<PermissaoDto> itens) {
        List<UsuarioPermissao> existentes = gravadas(usuario);

        if (usuario.getRole() != Role.USER || itens == null || itens.isEmpty()) {
            repository.deleteAll(existentes);
            return List.of();
        }

        exigirTelasDistintas(itens);

        Map<Tela, UsuarioPermissao> porTela = existentes.stream()
                .collect(Collectors.toMap(UsuarioPermissao::getTela, Function.identity()));
        Set<Tela> recebidas = itens.stream().map(PermissaoDto::tela).collect(Collectors.toSet());

        repository.deleteAll(existentes.stream().filter(p -> !recebidas.contains(p.getTela())).toList());

        for (PermissaoDto item : itens) {
            UsuarioPermissao permissao = porTela.get(item.tela());
            if (permissao == null) {
                permissao = new UsuarioPermissao();
                permissao.setUsuario(usuario);
                permissao.setTenant(usuario.getTenant());
                permissao.setTela(item.tela());
            }
            permissao.setNivel(item.nivel());
            repository.save(permissao);
        }

        return itens.stream()
                .sorted(Comparator.comparing(PermissaoDto::tela))
                .toList();
    }

    private List<UsuarioPermissao> gravadas(Usuario usuario) {
        return repository.findAllByUsuarioIdAndTenantId(usuario.getId(), usuario.getTenant().getId());
    }

    private static void exigirTelasDistintas(List<PermissaoDto> itens) {
        Set<Tela> vistas = EnumSet.noneOf(Tela.class);
        for (PermissaoDto item : itens) {
            if (!vistas.add(item.tela()))
                throw new BadRequestException(
                        "A tela " + item.tela().rotulo() + " aparece mais de uma vez nas permissões");
        }
    }
}
