package com.api.ero_api.usuario.service;

import com.api.ero_api.auditoria.enums.TipoEventoSeguranca;
import com.api.ero_api.auditoria.service.EventoSegurancaService;
import com.api.ero_api.compartilhado.dtos.PaginaDto;
import com.api.ero_api.compartilhado.exception.AcessoNegadoException;
import com.api.ero_api.compartilhado.exception.ConflitoException;
import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.compartilhado.exception.RegraNegocioException;
import com.api.ero_api.compartilhado.util.PaginacaoUtils;
import com.api.ero_api.permissao.service.CalculoPermissaoService;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.UsuarioAutenticado;
import com.api.ero_api.seguranca.autorizacao.AutorizacaoCache;
import com.api.ero_api.seguranca.senha.SenhaService;
import com.api.ero_api.seguranca.tenant.TenantContext;
import com.api.ero_api.sessao.enums.MotivoRevogacao;
import com.api.ero_api.sessao.service.SessaoService;
import com.api.ero_api.tenant.service.LimiteUsuariosService;
import com.api.ero_api.usuario.dtos.UsuarioCreateDto;
import com.api.ero_api.usuario.dtos.UsuarioRedefinirSenhaDto;
import com.api.ero_api.usuario.dtos.UsuarioResponseDto;
import com.api.ero_api.usuario.dtos.UsuarioSelectDto;
import com.api.ero_api.usuario.dtos.UsuarioUpdateDto;
import com.api.ero_api.usuario.entity.Usuario;
import com.api.ero_api.usuario.enums.Papel;
import com.api.ero_api.usuario.mapper.UsuarioMapper;
import com.api.ero_api.usuario.repository.UsuarioRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * MÓDULO-MODELO. Todo service novo segue este formato:
 * <ul>
 *   <li>injeção pelo construtor;</li>
 *   <li>{@code @Transactional(readOnly = true)} em leitura, {@code @Transactional} em escrita;</li>
 *   <li>{@link #buscarEntidade} para outros services, {@link #buscarPorId} para o controller;</li>
 *   <li>escreveu e vai devolver o DTO: {@code saveAndFlush} antes de mapear, para a
 *       resposta já trazer a {@code version} e o {@code updatedAt} novos;</li>
 *   <li>regras de negócio e de autorização fina aqui; o controller só delega;</li>
 *   <li>tenant nunca aparece: o filtro é automático.</li>
 * </ul>
 */
@Service
public class UsuarioService {

    private static final Set<String> ORDENAVEIS = Set.of("nome", "email", "createdAt", "ultimoLoginEm");
    private static final Sort ORDEM_PADRAO = Sort.by("nome");

    private final UsuarioRepository repository;
    private final SenhaService senhaService;
    private final SessaoService sessaoService;
    private final CalculoPermissaoService calculoPermissao;
    private final LimiteUsuariosService limiteUsuarios;
    private final AutorizacaoCache cache;
    private final EventoSegurancaService eventos;

    public UsuarioService(UsuarioRepository repository, SenhaService senhaService, SessaoService sessaoService,
                          CalculoPermissaoService calculoPermissao, LimiteUsuariosService limiteUsuarios,
                          AutorizacaoCache cache,
                          EventoSegurancaService eventos) {
        this.repository = repository;
        this.senhaService = senhaService;
        this.sessaoService = sessaoService;
        this.calculoPermissao = calculoPermissao;
        this.limiteUsuarios = limiteUsuarios;
        this.cache = cache;
        this.eventos = eventos;
    }

    // ---------------------------------------------------------------- leitura

    @Transactional(readOnly = true)
    public PaginaDto<UsuarioResponseDto> listar(String busca, Boolean ativo, Pageable pageable) {
        Pageable pagina = PaginacaoUtils.validar(pageable, ORDENAVEIS, ORDEM_PADRAO);
        String termo = busca == null || busca.isBlank() ? null : busca.trim();
        return PaginaDto.de(repository.buscarComFiltros(termo, ativo, pagina), UsuarioMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto buscarPorId(UUID id) {
        return UsuarioMapper.toResponseDto(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public List<UsuarioSelectDto> buscarParaSelecao() {
        return repository.buscarParaSelecao().stream().map(UsuarioMapper::toSelectDto).toList();
    }

    /**
     * Nomes de vários usuários numa consulta só (para outros services, ex.: auditoria).
     * Respeita o tenant atual: id de fora do contratante não aparece no mapa.
     */
    @Transactional(readOnly = true)
    public Map<UUID, String> buscarNomes(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return repository.buscarNomesPorIds(ids).stream()
                .collect(Collectors.toMap(UsuarioSelectDto::id, UsuarioSelectDto::nome));
    }

    /**
     * Para outros services. Respeita o tenant atual: usuário de outro contratante
     * dá 404. O superadmin só é visível para ele mesmo e para os fluxos internos
     * sem usuário logado (login, montagem da sessão), que rodam em contexto ROOT.
     */
    @Transactional(readOnly = true)
    public Usuario buscarEntidade(UUID id) {
        Usuario u = repository.buscarPorId(id)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
        Optional<UsuarioAutenticado> logado = SecurityUtils.usuarioLogado();
        boolean fluxoInternoSemUsuario = logado.isEmpty();
        if (u.getPapel() == Papel.SUPERADMIN && !fluxoInternoSemUsuario && !logado.get().superadmin()) {
            throw new NaoEncontradoException("Usuário não encontrado.");
        }
        return u;
    }

    @Transactional(readOnly = true)
    public boolean existeSuperadmin() {
        return repository.existeSuperadmin();
    }

    /**
     * Usuários ativos (sem o superadmin) por contratante, para a tela de contratantes.
     * Contratante sem nenhum ativo não aparece no mapa (= 0).
     */
    @Transactional(readOnly = true)
    public Map<UUID, Long> contarAtivosPorContratante(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }
        return repository.contarAtivosPorTenant(tenantIds).stream()
                .collect(Collectors.toMap(linha -> (UUID) linha[0], linha -> (Long) linha[1]));
    }

    // ---------------------------------------------------------------- escrita

    @Transactional
    public UsuarioResponseDto criar(UsuarioCreateDto dto) {
        UUID tenantId = SecurityUtils.exigirTenantSelecionado();
        validarPapelConcedido(dto.papel(), null);
        Usuario u = UsuarioMapper.toEntity(dto);
        validarEmailLivre(u.getEmail(), null);
        senhaService.validarPolitica(dto.senha(), u.getEmail(), u.getNome());
        u.setSenhaHash(senhaService.gerarHash(dto.senha()));
        u.setSenhaAlteradaEm(Instant.now());
        exigirVaga(tenantId);
        repository.saveAndFlush(u);
        eventos.registrar(TipoEventoSeguranca.USUARIO_CRIADO, u.getId(), tenantId, "papel=" + u.getPapel());
        return UsuarioMapper.toResponseDto(u);
    }

    @Transactional
    public UsuarioResponseDto atualizar(UUID id, UsuarioUpdateDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        Usuario u = buscarEntidade(id);
        garantirPodeAlterar(u);
        if (!u.getVersion().equals(dto.version())) {
            throw new ConflitoException("Este usuário foi alterado por outra pessoa. Recarregue e tente de novo.");
        }
        Papel papelAnterior = u.getPapel();
        if (dto.papel() != papelAnterior) {
            if (u.getId().equals(eu.usuarioId())) {
                throw new AcessoNegadoException("Você não pode alterar o próprio papel.");
            }
            validarPapelConcedido(dto.papel(), papelAnterior);
        }
        String email = UsuarioMapper.normalizarEmail(dto.email());
        if (!email.equals(u.getEmail())) {
            // Trocar o e-mail de login de outra pessoa é tomar a conta dela.
            exigirAdministrador(eu, "Só administradores podem alterar o e-mail de outro usuário.");
            validarEmailLivre(email, u.getId());
        }
        UsuarioMapper.atualizarEntidade(u, dto);
        repository.saveAndFlush(u);
        cache.invalidarUsuario(u.getId());
        eventos.registrar(TipoEventoSeguranca.USUARIO_ALTERADO, u.getId(), u.getTenantId(),
                papelAnterior != u.getPapel() ? "papel " + papelAnterior + " -> " + u.getPapel() : null);
        return UsuarioMapper.toResponseDto(u);
    }

    @Transactional
    public void inativar(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        Usuario u = buscarEntidade(id);
        garantirPodeAlterar(u);
        if (u.getId().equals(SecurityUtils.getUsuarioIdLogado())) {
            throw new AcessoNegadoException("Você não pode inativar a si mesmo.");
        }
        u.setAtivo(false);
        sessaoService.revogarTodasDoUsuario(u.getId(), MotivoRevogacao.USUARIO_INATIVADO, null);
        eventos.registrar(TipoEventoSeguranca.USUARIO_INATIVADO, u.getId(), u.getTenantId(), null);
    }

    /**
     * Reativar ocupa de novo uma vaga do limite de usuários do contratante. A linha
     * do usuário é travada antes de ler: no duplo clique em "Ativar", o segundo
     * espera o primeiro, já o lê ativo e não faz nada (sem pedir outra vaga).
     */
    @Transactional
    public void ativar(UUID id) {
        UUID tenantId = SecurityUtils.exigirTenantSelecionado();
        Usuario u = buscarEntidadeComBloqueio(id);
        garantirPodeAlterar(u);
        if (u.getId().equals(SecurityUtils.getUsuarioIdLogado())) {
            throw new AcessoNegadoException("Você não pode reativar a si mesmo.");
        }
        if (u.isAtivo()) {
            return;
        }
        exigirVaga(tenantId);
        u.setAtivo(true);
        cache.invalidarUsuario(u.getId());
        eventos.registrar(TipoEventoSeguranca.USUARIO_ATIVADO, u.getId(), u.getTenantId(), null);
    }

    /**
     * Libera uma conta bloqueada por excesso de tentativas. Só administrador e
     * nunca em si mesmo: zerar o próprio contador permitiria chutar senha sem limite.
     */
    @Transactional
    public void desbloquear(UUID id) {
        SecurityUtils.exigirTenantSelecionado();
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        exigirAdministrador(eu, "Só administradores podem desbloquear contas.");
        Usuario u = buscarEntidade(id);
        garantirPodeAlterar(u);
        if (u.getId().equals(eu.usuarioId())) {
            throw new AcessoNegadoException("Você não pode desbloquear a si mesmo.");
        }
        repository.atualizarTentativas(u.getId(), 0, null);
        eventos.registrar(TipoEventoSeguranca.CONTA_DESBLOQUEADA, u.getId(), u.getTenantId(), null);
    }

    /**
     * Senha temporária definida por um ADMINISTRADOR. Usuário comum não pode:
     * redefinir a senha de um colega é tomar a conta dele (OWASP A01).
     */
    @Transactional
    public void redefinirSenha(UUID id, UsuarioRedefinirSenhaDto dto) {
        SecurityUtils.exigirTenantSelecionado();
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        exigirAdministrador(eu, "Só administradores podem redefinir a senha de outro usuário.");
        Usuario u = buscarEntidade(id);
        garantirPodeAlterar(u);
        if (u.getId().equals(eu.usuarioId())) {
            throw new AcessoNegadoException("Para trocar a sua senha use \"Alterar minha senha\".");
        }
        senhaService.validarPolitica(dto.novaSenha(), u.getEmail(), u.getNome());
        u.setSenhaHash(senhaService.gerarHash(dto.novaSenha()));
        // Também derruba o código de login pendente: o auth recusa código anterior a esta data.
        u.setSenhaAlteradaEm(Instant.now());
        u.setExigirTrocaSenha(true);
        repository.atualizarTentativas(u.getId(), 0, null);
        sessaoService.revogarTodasDoUsuario(u.getId(), MotivoRevogacao.SENHA_REDEFINIDA, null);
        eventos.registrar(TipoEventoSeguranca.SENHA_REDEFINIDA, u.getId(), u.getTenantId(), null);
    }

    /**
     * Primeiro administrador de um contratante novo. Chamado pelo TenantService
     * em contexto ROOT (superadmin), por isso atribui o tenant explicitamente.
     * Ocupa a 1ª vaga do limite, sem checar: o contratante acabou de nascer e o
     * limite é no mínimo 1 (e em ROOT a contagem enxergaria todos os contratantes).
     */
    @Transactional
    public Usuario criarAdminInicial(UUID tenantId, String nome, String email, String senha) {
        return criarComPapel(tenantId, Papel.ADMIN, nome, email, senha, true);
    }

    /** Seed: superadmin do tenant Plataforma. Chamado em contexto ROOT. */
    @Transactional
    public Usuario criarSuperadmin(String nome, String email, String senha) {
        return criarComPapel(TenantContext.ROOT, Papel.SUPERADMIN, nome, email, senha, false);
    }

    /**
     * Algo do usuário mudou fora do cadastro (ex.: permissões): sobe a version se
     * ainda for a que a tela viu (senão 409) e devolve o registro atualizado.
     */
    @Transactional
    public Usuario registrarAlteracao(UUID id, Long versaoVista) {
        if (repository.marcarAlteracao(id, versaoVista, Instant.now(), SecurityUtils.getUsuarioIdLogado()) == 0) {
            throw new ConflitoException("Este usuário foi alterado por outra pessoa. Recarregue e tente de novo.");
        }
        return buscarEntidade(id);
    }

    // ---------------------------------------------------------------- login (AuthService, contexto ROOT)

    /** Trava a linha do usuário: tentativas paralelas são contadas uma a uma. */
    @Transactional
    public Optional<Usuario> buscarParaLoginComBloqueio(String email) {
        return repository.buscarPorEmailComBloqueio(UsuarioMapper.normalizarEmail(email));
    }

    @Transactional
    public Optional<Usuario> buscarComBloqueio(UUID id) {
        return repository.buscarPorIdComBloqueio(id);
    }

    @Transactional
    public void atualizarTentativas(UUID id, int tentativas, Instant bloqueadoAte) {
        repository.atualizarTentativas(id, tentativas, bloqueadoAte);
    }

    @Transactional
    public void registrarLogin(UUID id, Instant agora) {
        repository.registrarLogin(id, agora);
    }

    /** Hash regravado com parâmetros novos no login: UPDATE direto, sem mexer na version. */
    @Transactional
    public void regravarHashSenha(UUID id, String hash) {
        repository.regravarHashSenha(id, hash);
    }

    // ---------------------------------------------------------------- regras

    /**
     * {@link #buscarEntidade} com a linha travada até o fim da transação. A trava vem
     * antes da leitura, então o estado lido já é o gravado por quem a segurava.
     */
    private Usuario buscarEntidadeComBloqueio(UUID id) {
        repository.buscarPorIdComBloqueio(id);
        return buscarEntidade(id);
    }

    /**
     * Limite de usuários ativos do contratante (definido pelo superadmin). Trava a
     * linha do contratante antes de contar, para dois cadastros simultâneos não
     * ocuparem a mesma última vaga. Se o limite foi reduzido abaixo do uso, nada é
     * desligado: só criar e reativar ficam travados.
     */
    private void exigirVaga(UUID tenantId) {
        Integer limite = limiteUsuarios.travarELerLimite(tenantId);
        if (limite == null) {
            return;
        }
        long ativos = repository.contarAtivos();
        if (ativos >= limite) {
            throw new RegraNegocioException("Este contratante já usa " + ativos + " de " + limite
                    + " usuários. Fale com o suporte para ampliar.");
        }
    }

    private Usuario criarComPapel(UUID tenantId, Papel papel, String nome, String email, String senha,
                                  boolean exigirTroca) {
        Usuario u = UsuarioMapper.toEntity(new UsuarioCreateDto(nome, email, senha, papel));
        u.atribuirTenant(tenantId);
        u.setExigirTrocaSenha(exigirTroca);
        validarEmailLivre(u.getEmail(), null);
        senhaService.validarPolitica(senha, u.getEmail(), u.getNome());
        u.setSenhaHash(senhaService.gerarHash(senha));
        u.setSenhaAlteradaEm(Instant.now());
        repository.saveAndFlush(u);
        eventos.registrar(TipoEventoSeguranca.USUARIO_CRIADO, u.getId(), tenantId, "papel=" + papel);
        return u;
    }

    private void validarEmailLivre(String email, UUID ignorarId) {
        if (repository.emailEmUsoNoSistema(email, ignorarId == null ? TenantContext.NENHUM : ignorarId)) {
            throw new ConflitoException("Este e-mail já está em uso.");
        }
    }

    /** SUPERADMIN nunca pela API; ADMIN só por quem é ADMIN ou SUPERADMIN. */
    private static void validarPapelConcedido(Papel novo, Papel anterior) {
        if (novo == Papel.SUPERADMIN) {
            throw new AcessoNegadoException("Papel inválido.");
        }
        boolean mexeComAdmin = novo == Papel.ADMIN || anterior == Papel.ADMIN;
        if (mexeComAdmin) {
            exigirAdministrador(SecurityUtils.exigirUsuario(),
                    "Só administradores podem definir o papel de administrador.");
        }
    }

    private static void exigirAdministrador(UsuarioAutenticado eu, String mensagem) {
        if (eu.papel() == Papel.USUARIO) {
            throw new AcessoNegadoException(mensagem);
        }
    }

    /**
     * Quem pode mexer no cadastro de quem:
     * <ul>
     *   <li>superadmin só é alterado por superadmin (para os outros, nem existe);</li>
     *   <li>usuário comum não altera administrador;</li>
     *   <li>usuário comum só altera colega que NÃO tenha acesso que ele não tem.</li>
     * </ul>
     */
    private void garantirPodeAlterar(Usuario alvo) {
        UsuarioAutenticado eu = SecurityUtils.exigirUsuario();
        if (alvo.getPapel() == Papel.SUPERADMIN && !eu.superadmin()) {
            throw new NaoEncontradoException("Usuário não encontrado.");
        }
        if (eu.papel() != Papel.USUARIO || alvo.getId().equals(eu.usuarioId())) {
            return;
        }
        if (alvo.getPapel() == Papel.ADMIN) {
            throw new AcessoNegadoException("Só administradores podem alterar administradores.");
        }
        if (!eu.authorities().containsAll(calculoPermissao.calcular(alvo))) {
            throw new AcessoNegadoException("Você não pode alterar um usuário que tem acessos que você não tem.");
        }
    }
}
