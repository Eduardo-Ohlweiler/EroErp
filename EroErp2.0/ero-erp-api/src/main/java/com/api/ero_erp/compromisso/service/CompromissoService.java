package com.api.ero_erp.compromisso.service;

import com.api.ero_erp.compromisso.dtos.CancelarCompromissoDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCreateDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeRequestDto;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeResponseDto;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeResponseDto.Choque;
import com.api.ero_erp.compromisso.dtos.DisponibilidadeResponseDto.Ocorrencia;
import com.api.ero_erp.compromisso.dtos.OcorrenciaDto;
import com.api.ero_erp.compromisso.dtos.RecorrenciaDto;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.entity.CompromissoConvidado;
import com.api.ero_erp.compromisso.enums.EscopoCancelamento;
import com.api.ero_erp.compromisso.enums.StatusCompromisso;
import com.api.ero_erp.compromisso.mapper.CompromissoMapper;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.filial.entity.Filial;
import com.api.ero_erp.filial.service.FilialService;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Agenda — redesenho do {@code CompromissoService} do EroErp antigo.
 *
 * <p>O antigo tinha um conflito só, global no tenant: dois profissionais não
 * podiam atender no mesmo horário. Aqui o conflito é <b>por usuário</b>: o
 * responsável ocupado recusa (409); o convidado ocupado é só aviso, que a
 * tela busca em {@link #disponibilidade}. Ver docs/12.
 *
 * <p>Logs levam só id e operação (regra 5 do CLAUDE.md) — o título pode
 * carregar o nome do cliente.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CompromissoService {

    /** A janela mais larga que o calendário pede de uma vez (o mês com folga). */
    private static final Duration JANELA_MAXIMA = Duration.ofDays(62);
    private static final Duration DURACAO_MAXIMA = Duration.ofHours(24);
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
    private static final DateTimeFormatter DIA_HORA = DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm");

    private final CompromissoRepository compromissoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FilialService filialService;
    private final PessoaService pessoaService;
    private final SecurityUtils securityUtils;

    @Value("${app.acesso.fuso-horario:America/Sao_Paulo}")
    private String fusoHorario;

    // ─────────────────────────────────────────────────────────────────────
    //  Leitura
    // ─────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CompromissoCalendarioDto> calendario(Instant inicio, Instant fim, UUID filialId, UUID usuarioId) {
        if (!fim.isAfter(inicio)) {
            throw new BadRequestException("O fim da janela deve ser depois do início");
        }
        if (Duration.between(inicio, fim).compareTo(JANELA_MAXIMA) > 0) {
            throw new BadRequestException("Peça no máximo 62 dias de agenda por vez");
        }
        UUID tenantId = securityUtils.getTenantIdLogado();
        List<UUID> ids = compromissoRepository.findIdsDoCalendario(tenantId, inicio, fim, filialId, usuarioId);
        return carregarNaOrdem(ids, tenantId).stream()
                .map(CompromissoMapper::toCalendario)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompromissoResponseDto findByIdResponse(UUID id) {
        return CompromissoMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Compromisso findById(UUID id) {
        return compromissoRepository.findByIdAndTenantId(id, securityUtils.getTenantIdLogado())
                .orElseThrow(() -> new NotFoundException("Compromisso não encontrado"));
    }

    /**
     * Quem já está ocupado nos horários que o formulário está montando — uma
     * linha por ocorrência. Não grava nada: é o que a tela mostra antes de
     * salvar, e o mesmo cálculo que o salvar usa para recusar.
     */
    @Transactional(readOnly = true)
    public DisponibilidadeResponseDto disponibilidade(DisponibilidadeRequestDto dto) {
        validarPeriodo(dto.inicio(), dto.fim());
        UUID tenantId = securityUtils.getTenantIdLogado();
        List<Periodo> periodos = gerarPeriodos(dto.inicio(), dto.fim(), dto.recorrencia(), dto.ocorrencias());

        // Só os usuários deste tenant: um id de fora não ganha nome nem choque
        Set<UUID> pedidos = new LinkedHashSet<>();
        if (dto.responsavelId() != null) pedidos.add(dto.responsavelId());
        if (dto.convidadoIds() != null) pedidos.addAll(dto.convidadoIds());
        Map<UUID, Usuario> usuarios = new LinkedHashMap<>();
        for (UUID id : pedidos) {
            usuarioRepository.findByIdAndTenantId(id, tenantId).ifPresent(u -> usuarios.put(id, u));
        }

        Map<Periodo, List<Choque>> choques =
                choques(tenantId, usuarios, dto.responsavelId(), periodos, dto.ignorarId());
        List<Ocorrencia> ocorrencias = periodos.stream()
                .map(p -> new Ocorrencia(p.inicio(), p.fim(), choques.getOrDefault(p, List.of())))
                .toList();
        boolean bloqueia = ocorrencias.stream()
                .flatMap(o -> o.choques().stream())
                .anyMatch(Choque::responsavel);
        return new DisponibilidadeResponseDto(ocorrencias, bloqueia);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Escrita
    // ─────────────────────────────────────────────────────────────────────

    /** Devolve todas as ocorrências criadas — uma só, sem recorrência. */
    @Transactional
    public List<CompromissoResponseDto> create(CompromissoCreateDto dto) {
        UUID tenantId = securityUtils.getTenantIdLogado();
        validarPeriodo(dto.inicio(), dto.fim());

        Filial filial = exigirFilialAtiva(dto.filialId());
        Usuario responsavel = exigirUsuarioAtivo(dto.responsavelId(), tenantId, "Responsável");
        Pessoa pessoa = dto.pessoaId() != null ? exigirPessoaAtiva(dto.pessoaId()) : null;
        List<Usuario> convidados = resolverConvidados(dto.convidadoIds(), responsavel.getId(), Set.of(), tenantId);

        List<Periodo> periodos = gerarPeriodos(dto.inicio(), dto.fim(), dto.recorrencia(), dto.ocorrencias());
        exigirResponsavelLivre(tenantId, responsavel, periodos, null);

        // Série só com mais de uma data: tirando as outras na prévia, sobra um
        // compromisso avulso (o CHECK exige série e tipo juntos)
        boolean serie = dto.recorrencia() != null && periodos.size() > 1;
        UUID serieId = serie ? UUID.randomUUID() : null;
        Usuario criador = securityUtils.getUsuarioLogado();
        List<Compromisso> criados = new ArrayList<>();
        for (Periodo periodo : periodos) {
            Compromisso c = new Compromisso();
            c.setTenant(securityUtils.getTenantReference());
            c.setFilial(filial);
            c.setResponsavel(responsavel);
            c.setPessoa(pessoa);
            c.setTitulo(dto.titulo().trim());
            c.setDescricao(textoOuNulo(dto.descricao()));
            c.setCor(corOuNula(dto.cor()));
            c.setInicio(periodo.inicio());
            c.setFim(periodo.fim());
            c.setSerieId(serieId);
            c.setTipoRecorrencia(serie ? dto.recorrencia().tipo() : null);
            c.setCreatedBy(criador);
            convidados.forEach(u -> adicionarConvidado(c, u));
            criados.add(compromissoRepository.save(c));
        }

        log.info("Compromisso criado id={} ocorrencias={}", criados.getFirst().getId(), criados.size());
        return criados.stream().map(CompromissoMapper::toResponse).toList();
    }

    @Transactional
    public CompromissoResponseDto update(UUID id, CompromissoUpdateDto dto) {
        Compromisso c = findById(id);
        UUID tenantId = c.getTenant().getId();
        exigirAberto(c);
        validarPeriodo(dto.inicio(), dto.fim());

        // O que já estava não é reconferido: o compromisso de um responsável
        // que foi inativado ainda pode ter a descrição corrigida.
        Filial filial = c.getFilial().getId().equals(dto.filialId())
                ? c.getFilial() : exigirFilialAtiva(dto.filialId());
        Usuario responsavel = c.getResponsavel().getId().equals(dto.responsavelId())
                ? c.getResponsavel() : exigirUsuarioAtivo(dto.responsavelId(), tenantId, "Responsável");
        Pessoa pessoa = dto.pessoaId() == null ? null
                : c.getPessoa() != null && c.getPessoa().getId().equals(dto.pessoaId())
                ? c.getPessoa() : exigirPessoaAtiva(dto.pessoaId());
        Set<UUID> jaConvidados = c.getConvidados().stream()
                .map(cv -> cv.getUsuario().getId())
                .collect(Collectors.toSet());
        List<Usuario> novos = resolverConvidados(dto.convidadoIds(), responsavel.getId(), jaConvidados, tenantId);

        // Antes de mexer na entidade: a native do conflito descarrega a sessão
        exigirResponsavelLivre(tenantId, responsavel, List.of(new Periodo(dto.inicio(), dto.fim())), id);

        boolean remarcado = !c.getInicio().equals(dto.inicio()) || !c.getFim().equals(dto.fim());
        c.setFilial(filial);
        c.setResponsavel(responsavel);
        c.setPessoa(pessoa);
        c.setTitulo(dto.titulo().trim());
        c.setDescricao(textoOuNulo(dto.descricao()));
        c.setCor(corOuNula(dto.cor()));
        c.setInicio(dto.inicio());
        c.setFim(dto.fim());
        // A confirmação era daquele horário; remarcado, volta a esperar uma nova
        if (remarcado && c.getStatus() == StatusCompromisso.CONFIRMADO) {
            c.setStatus(StatusCompromisso.AGENDADO);
        }
        sincronizarConvidados(c, dto.convidadoIds(), novos);
        c.setUpdatedBy(securityUtils.getUsuarioLogado());

        log.info("Compromisso alterado id={} remarcado={}", id, remarcado);
        return CompromissoMapper.toResponse(compromissoRepository.save(c));
    }

    @Transactional
    public CompromissoResponseDto confirmar(UUID id) {
        Compromisso c = findById(id);
        exigirAberto(c);
        if (c.getStatus() == StatusCompromisso.CONFIRMADO) {
            throw new ConflictException("Este compromisso já está confirmado");
        }
        return mudarStatus(c, StatusCompromisso.CONFIRMADO);
    }

    @Transactional
    public CompromissoResponseDto concluir(UUID id) {
        Compromisso c = findById(id);
        exigirAberto(c);
        return mudarStatus(c, StatusCompromisso.CONCLUIDO);
    }

    @Transactional
    public CompromissoResponseDto faltou(UUID id) {
        Compromisso c = findById(id);
        exigirAberto(c);
        if (c.getInicio().isAfter(Instant.now())) {
            throw new ConflictException("Só se marca falta depois do horário de início");
        }
        return mudarStatus(c, StatusCompromisso.FALTOU);
    }

    /**
     * Cancela este ou, numa série, este e os seguintes ainda abertos — os que
     * já aconteceram ficam como estão. Devolve o compromisso pedido.
     */
    @Transactional
    public CompromissoResponseDto cancelar(UUID id, CancelarCompromissoDto dto) {
        Compromisso c = findById(id);
        exigirAberto(c);
        String motivo = dto != null ? textoOuNulo(dto.motivo()) : null;
        boolean seguintes = dto != null && dto.escopo() == EscopoCancelamento.SEGUINTES;

        List<Compromisso> alvos = List.of(c);
        if (seguintes) {
            if (c.getSerieId() == null) {
                throw new BadRequestException("Este compromisso não faz parte de uma série");
            }
            alvos = compromissoRepository.findAbertosDaSerieAPartirDe(
                    c.getTenant().getId(), c.getSerieId(), c.getInicio());
        }

        Usuario quem = securityUtils.getUsuarioLogado();
        for (Compromisso alvo : alvos) {
            alvo.setStatus(StatusCompromisso.CANCELADO);
            alvo.setMotivoCancelamento(motivo);
            alvo.setUpdatedBy(quem);
        }
        compromissoRepository.saveAll(alvos);

        log.info("Compromisso cancelado id={} quantidade={}", id, alvos.size());
        return CompromissoMapper.toResponse(c);
    }

    // ─────────────────────────────────────────────────────────────────────

    private CompromissoResponseDto mudarStatus(Compromisso c, StatusCompromisso novo) {
        c.setStatus(novo);
        c.setUpdatedBy(securityUtils.getUsuarioLogado());
        log.info("Compromisso id={} agora {}", c.getId(), novo);
        return CompromissoMapper.toResponse(compromissoRepository.save(c));
    }

    private static void exigirAberto(Compromisso c) {
        switch (c.getStatus()) {
            case CONCLUIDO -> throw new ConflictException("Este compromisso já foi concluído");
            case CANCELADO -> throw new ConflictException("Este compromisso foi cancelado");
            case FALTOU -> throw new ConflictException("Este compromisso está marcado como falta");
            default -> { }
        }
    }

    private static void validarPeriodo(Instant inicio, Instant fim) {
        if (!fim.isAfter(inicio)) {
            throw new BadRequestException("O fim deve ser depois do início");
        }
        if (Duration.between(inicio, fim).compareTo(DURACAO_MAXIMA) > 0) {
            throw new BadRequestException("Um compromisso dura no máximo 24 horas");
        }
    }

    /**
     * As ocorrências. Com a lista da prévia ({@code ocorrencias}, depois de o
     * usuário editar ou tirar datas), vale ela, revalidada data a data: o
     * servidor grava o que a tela mostrou, não o que regeneraria. Sem ela, são
     * calculadas no fuso do sistema: "toda semana às 14h" continua às 14h de
     * parede mesmo que o fuso mude no meio da série.
     */
    private List<Periodo> gerarPeriodos(Instant inicio, Instant fim, RecorrenciaDto recorrencia,
                                        List<OcorrenciaDto> ocorrencias) {
        if (ocorrencias != null) {
            if (recorrencia == null) {
                throw new BadRequestException("Datas avulsas só numa série: marque que o compromisso se repete");
            }
            List<Periodo> lista = ocorrencias.stream()
                    .map(o -> new Periodo(o.inicio(), o.fim()))
                    .sorted(Comparator.comparing(Periodo::inicio))
                    .toList();
            lista.forEach(p -> validarPeriodo(p.inicio(), p.fim()));
            for (int i = 1; i < lista.size(); i++) {
                Periodo anterior = lista.get(i - 1);
                Periodo atual = lista.get(i);
                if (anterior.sobrepoe(atual.inicio(), atual.fim())) {
                    throw new BadRequestException("As datas %s e %s se sobrepõem"
                            .formatted(formatarCurto(anterior.inicio()), formatarCurto(atual.inicio())));
                }
            }
            return lista;
        }
        if (recorrencia == null) {
            return List.of(new Periodo(inicio, fim));
        }
        ZonedDateTime base = inicio.atZone(ZoneId.of(fusoHorario));
        Duration duracao = Duration.between(inicio, fim);
        List<Periodo> periodos = new ArrayList<>();
        for (int n = 0; n < recorrencia.quantidade(); n++) {
            Instant i = recorrencia.tipo().ocorrencia(base, n).toInstant();
            periodos.add(new Periodo(i, i.plus(duracao)));
        }
        return periodos;
    }

    private void exigirResponsavelLivre(UUID tenantId, Usuario responsavel, List<Periodo> periodos,
                                        UUID ignorarId) {
        Map<Periodo, List<Choque>> choques =
                choques(tenantId, Map.of(responsavel.getId(), responsavel), responsavel.getId(), periodos, ignorarId);
        for (Periodo p : periodos) {
            List<Choque> lista = choques.get(p);
            if (lista != null) {
                Choque choque = lista.getFirst();
                throw new ConflictException("%s já tem compromisso neste horário: \"%s\", %s"
                        .formatted(responsavel.getNome(), choque.titulo(), formatar(choque.inicio())));
            }
        }
    }

    /**
     * Os choques de cada período com os compromissos que os usuários já têm.
     * Uma consulta só, na faixa inteira da série; o cruzamento por ocorrência
     * é feito aqui, em vez de uma ida ao banco por ocorrência.
     */
    private Map<Periodo, List<Choque>> choques(UUID tenantId, Map<UUID, Usuario> usuarios, UUID responsavelId,
                                               List<Periodo> periodos, UUID ignorarId) {
        if (usuarios.isEmpty()) return Map.of();
        Instant de = periodos.getFirst().inicio();
        Instant ate = periodos.getLast().fim();

        List<Object[]> ocupacoes = compromissoRepository.findOcupacoes(
                tenantId, usuarios.keySet(), de, ate, ignorarId);
        if (ocupacoes.isEmpty()) return Map.of();

        Set<UUID> ids = ocupacoes.stream().map(o -> (UUID) o[1]).collect(Collectors.toSet());
        Map<UUID, Compromisso> existentes = compromissoRepository.findAllCompletos(ids, tenantId).stream()
                .collect(Collectors.toMap(Compromisso::getId, Function.identity()));

        Map<Periodo, List<Choque>> resultado = new LinkedHashMap<>();
        for (Periodo p : periodos) {
            List<Choque> lista = new ArrayList<>();
            for (Object[] o : ocupacoes) {
                UUID usuarioId = (UUID) o[0];
                Compromisso existente = existentes.get((UUID) o[1]);
                if (existente == null || !p.sobrepoe(existente.getInicio(), existente.getFim())) continue;
                lista.add(new Choque(
                        usuarioId,
                        usuarios.get(usuarioId).getNome(),
                        usuarioId.equals(responsavelId),
                        existente.getId(),
                        existente.getTitulo(),
                        existente.getInicio(),
                        existente.getFim()));
            }
            if (!lista.isEmpty()) {
                // O do responsável primeiro: é o que impede salvar
                lista.sort(Comparator.comparing((Choque ch) -> !ch.responsavel()).thenComparing(Choque::inicio));
                resultado.put(p, lista);
            }
        }
        return resultado;
    }

    private Filial exigirFilialAtiva(UUID filialId) {
        Filial filial = filialService.findById(filialId);
        if (!Boolean.TRUE.equals(filial.getAtivo())) {
            throw new ConflictException("A filial escolhida está inativa");
        }
        return filial;
    }

    private Pessoa exigirPessoaAtiva(UUID pessoaId) {
        Pessoa pessoa = pessoaService.findById(pessoaId);
        if (!Boolean.TRUE.equals(pessoa.getAtivo())) {
            throw new ConflictException("O cliente escolhido está inativo");
        }
        return pessoa;
    }

    /** {@code papel} entra na frase: "Responsável não encontrado", "Convidado está inativo". */
    private Usuario exigirUsuarioAtivo(UUID usuarioId, UUID tenantId, String papel) {
        Usuario usuario = usuarioRepository.findByIdAndTenantId(usuarioId, tenantId)
                .orElseThrow(() -> new NotFoundException(papel + " não encontrado"));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ConflictException(papel + " está inativo: " + usuario.getNome());
        }
        return usuario;
    }

    /**
     * Os convidados que entram agora. Quem já era convidado não é
     * reconferido (pode ter sido inativado depois); o responsável não é
     * convidado de si mesmo, nem alguém duas vezes.
     */
    private List<Usuario> resolverConvidados(List<UUID> ids, UUID responsavelId, Set<UUID> jaConvidados,
                                             UUID tenantId) {
        if (ids == null || ids.isEmpty()) return List.of();
        if (new LinkedHashSet<>(ids).size() != ids.size()) {
            throw new BadRequestException("O mesmo convidado aparece duas vezes");
        }
        if (ids.contains(responsavelId)) {
            throw new BadRequestException("O responsável já participa: não precisa ser convidado");
        }
        return ids.stream()
                .filter(id -> !jaConvidados.contains(id))
                .map(id -> exigirUsuarioAtivo(id, tenantId, "Convidado"))
                .toList();
    }

    private void sincronizarConvidados(Compromisso c, List<UUID> ids, List<Usuario> novos) {
        Set<UUID> manter = ids == null ? Set.of() : Set.copyOf(ids);
        c.getConvidados().removeIf(cv -> !manter.contains(cv.getUsuario().getId()));
        novos.forEach(u -> adicionarConvidado(c, u));
    }

    private static void adicionarConvidado(Compromisso c, Usuario usuario) {
        CompromissoConvidado cv = new CompromissoConvidado();
        cv.setTenant(c.getTenant());
        cv.setCompromisso(c);
        cv.setUsuario(usuario);
        c.getConvidados().add(cv);
    }

    private List<Compromisso> carregarNaOrdem(List<UUID> ids, UUID tenantId) {
        if (ids.isEmpty()) return List.of();
        Map<UUID, Integer> posicao = new LinkedHashMap<>();
        for (int i = 0; i < ids.size(); i++) posicao.put(ids.get(i), i);
        return compromissoRepository.findAllCompletos(ids, tenantId).stream()
                .sorted(Comparator.comparing(c -> posicao.get(c.getId())))
                .toList();
    }

    private String formatar(Instant instante) {
        return DATA_HORA.format(instante.atZone(ZoneId.of(fusoHorario)));
    }

    private String formatarCurto(Instant instante) {
        return DIA_HORA.format(instante.atZone(ZoneId.of(fusoHorario)));
    }

    private static String corOuNula(String cor) {
        return cor != null && !cor.isBlank() ? cor.trim().toUpperCase(Locale.ROOT) : null;
    }

    private static String textoOuNulo(String valor) {
        return valor != null && !valor.isBlank() ? valor.trim() : null;
    }

    /** Um intervalo [inicio, fim) — a ocorrência que se quer marcar. */
    private record Periodo(Instant inicio, Instant fim) {
        boolean sobrepoe(Instant outroInicio, Instant outroFim) {
            return inicio.isBefore(outroFim) && fim.isAfter(outroInicio);
        }
    }
}
