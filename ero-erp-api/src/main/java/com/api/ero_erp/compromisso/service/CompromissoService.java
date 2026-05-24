package com.api.ero_erp.compromisso.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.compromisso.dtos.CompromissoCalendarioDto;
import com.api.ero_erp.compromisso.dtos.CompromissoCreateDto;
import com.api.ero_erp.compromisso.dtos.CompromissoResponseDto;
import com.api.ero_erp.compromisso.dtos.CompromissoUpdateDto;
import com.api.ero_erp.compromisso.entity.Compromisso;
import com.api.ero_erp.compromisso.enums.TipoRecorrencia;
import com.api.ero_erp.compromisso.mapper.CompromissoMapper;
import com.api.ero_erp.compromisso.repository.CompromissoRepository;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CompromissoService {

    private final CompromissoRepository compromissoRepository;
    private final ClienteService        clienteService;
    private final UsuarioService        usuarioService;
    private final PessoaService         pessoaService;
    private final SecurityUtils         securityUtils;

    public CompromissoService(
            CompromissoRepository compromissoRepository,
            ClienteService        clienteService,
            UsuarioService        usuarioService,
            PessoaService         pessoaService,
            SecurityUtils         securityUtils
    ) {
        this.compromissoRepository = compromissoRepository;
        this.clienteService        = clienteService;
        this.usuarioService        = usuarioService;
        this.pessoaService         = pessoaService;
        this.securityUtils         = securityUtils;
    }

    @Transactional(readOnly = true)
    public Compromisso findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Compromisso não encontrado"));
    }

    @Transactional(readOnly = true)
    public CompromissoResponseDto findByIdResponse(Long id) {
        return CompromissoMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<CompromissoResponseDto> getAll(
            Pageable      pageable,
            String        titulo,
            Long          pessoaId,
            Long          usuarioId,
            Boolean       cancelado,
            Boolean       concluido,
            LocalDateTime inicio,
            LocalDateTime fim
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository
                .findAllWithFilters(pageable, clienteId, titulo, pessoaId,
                        usuarioId, cancelado, concluido, inicio, fim)
                .map(CompromissoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<CompromissoCalendarioDto> getCalendario(LocalDateTime inicio, LocalDateTime fim) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return compromissoRepository.findByPeriodo(clienteId, inicio, fim)
                .stream()
                .map(CompromissoMapper::toCalendarioDto)
                .toList();
    }

    @Transactional
    public List<CompromissoResponseDto> create(CompromissoCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarHorario(dto.inicio(), dto.fim());
        validarConflito(clienteId, dto.inicio(), dto.fim(), null);

        boolean temRecorrencia = Boolean.TRUE.equals(dto.recorrenciaSimNao());
        if (temRecorrencia)
            validarRecorrencia(dto.tipoRecorrencia(), dto.quantidadeRecorrencia());

        Pessoa pessoa = resolverPessoa(dto.pessoaId());

        Compromisso pai = buildCompromisso(
                dto.titulo(), dto.descricao(), dto.cor(),
                dto.inicio(), dto.fim(),
                cliente, usuario, pessoa,
                temRecorrencia,
                temRecorrencia ? dto.tipoRecorrencia()       : null,
                temRecorrencia ? dto.quantidadeRecorrencia() : null,
                null
        );
        compromissoRepository.save(pai);

        pai.setCompromissoPai(pai);
        compromissoRepository.save(pai);

        List<CompromissoResponseDto> result = new ArrayList<>();
        result.add(CompromissoMapper.toDto(pai));

        if (temRecorrencia
                && dto.quantidadeRecorrencia() != null
                && dto.quantidadeRecorrencia() > 1) {

            LocalDateTime inicioRec = dto.inicio();
            LocalDateTime fimRec    = dto.fim();

            for (int i = 1; i < dto.quantidadeRecorrencia(); i++) {
                inicioRec = proximaOcorrencia(inicioRec, dto.tipoRecorrencia());
                fimRec    = proximaOcorrencia(fimRec,    dto.tipoRecorrencia());

                inicioRec = ajustaSeDomingo(inicioRec);
                fimRec    = ajustaSeDomingo(fimRec);

                validarConflito(clienteId, inicioRec, fimRec, null);

                Compromisso filho = buildCompromisso(
                        dto.titulo(), dto.descricao(), dto.cor(),
                        inicioRec, fimRec,
                        cliente, usuario, pessoa,
                        true,
                        dto.tipoRecorrencia(),
                        dto.quantidadeRecorrencia(),
                        pai
                );
                compromissoRepository.save(filho);
                result.add(CompromissoMapper.toDto(filho));
            }
        }

        return result;
    }

    @Transactional
    public CompromissoResponseDto update(Long id, CompromissoUpdateDto dto) {
        Long        clienteId   = securityUtils.getClienteIdLogado();
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Não é possível editar um compromisso cancelado");
        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Não é possível editar um compromisso já concluído");

        validarHorario(dto.inicio(), dto.fim());
        validarConflito(clienteId, dto.inicio(), dto.fim(), id);

        Pessoa pessoa = resolverPessoa(dto.pessoaId());

        compromisso.setTitulo(dto.titulo());
        compromisso.setDescricao(dto.descricao());
        compromisso.setCor(dto.cor() != null ? dto.cor() : "#3a87ad");
        compromisso.setInicio(dto.inicio());
        compromisso.setFim(dto.fim());
        compromisso.setPessoa(pessoa);
        compromisso.setUpdatedBy(usuario);
        return CompromissoMapper.toDto(compromissoRepository.save(compromisso));
    }

    @Transactional
    public CompromissoResponseDto cancelar(Long id, String motivo) {
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Não é possível cancelar um compromisso já concluído");
        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Compromisso já está cancelado");

        compromisso.setCancelado(true);
        compromisso.setMotivoCancelamento(motivo);
        compromisso.setUpdatedBy(usuario);

        return CompromissoMapper.toDto(compromissoRepository.save(compromisso));
    }

    @Transactional
    public CompromissoResponseDto concluir(Long id) {
        Compromisso compromisso = findById(id);
        Usuario     usuario     = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        if (Boolean.TRUE.equals(compromisso.getCancelado()))
            throw new BadRequestException("Não é possível concluir um compromisso cancelado");
        if (Boolean.TRUE.equals(compromisso.getConcluido()))
            throw new BadRequestException("Compromisso já está concluído");

        compromisso.setConcluido(true);
        compromisso.setUpdatedBy(usuario);

        return CompromissoMapper.toDto(compromissoRepository.save(compromisso));
    }

    @Transactional
    public void delete(Long id) {
        Compromisso compromisso = findById(id);

        boolean isPai = compromisso.getCompromissoPai() != null
                && compromisso.getCompromissoPai().getId().equals(compromisso.getId());

        if (isPai) {
            // Deleta todos os filhos antes de remover o pai
            compromissoRepository
                    .findByCompromissoPaiIdOrderByInicio(id)
                    .stream()
                    .filter(f -> !f.getId().equals(id))
                    .forEach(f -> {
                        f.setCompromissoPai(null); // quebra FK antes de deletar
                        compromissoRepository.delete(f);
                    });

            compromisso.setCompromissoPai(null);
            compromissoRepository.save(compromisso);
        }

        compromissoRepository.delete(compromisso);
    }

    private Compromisso buildCompromisso(
            String          titulo,
            String          descricao,
            String          cor,
            LocalDateTime   inicio,
            LocalDateTime   fim,
            Cliente         cliente,
            Usuario         usuario,
            Pessoa          pessoa,
            boolean         recorrenciaSimNao,
            TipoRecorrencia tipoRecorrencia,
            Integer         quantidadeRecorrencia,
            Compromisso     pai
    ) {
        Compromisso c = new Compromisso();
        c.setCliente(cliente);
        c.setUsuario(usuario);
        c.setPessoa(pessoa);
        c.setTitulo(titulo);
        c.setDescricao(descricao);
        c.setCor(cor != null ? cor : "#3a87ad");
        c.setInicio(inicio);
        c.setFim(fim);
        c.setCancelado(false);
        c.setConcluido(false);
        c.setRecorrenciaSimNao(recorrenciaSimNao);
        c.setTipoRecorrencia(tipoRecorrencia);
        c.setQuantidadeRecorrencia(quantidadeRecorrencia);
        c.setCompromissoPai(pai);
        c.setCreatedBy(usuario);
        return c;
    }

    private Pessoa resolverPessoa(Long pessoaId) {
        if (pessoaId == null)
            return null;
        return pessoaService.findById(pessoaId);
    }

    private void validarHorario(LocalDateTime inicio, LocalDateTime fim) {
        if (!fim.isAfter(inicio))
            throw new BadRequestException("O horário de fim deve ser posterior ao de início");
    }

    private void validarConflito(Long clienteId, LocalDateTime inicio, LocalDateTime fim, Long excludeId) {
        if (compromissoRepository.existsConflict(clienteId, inicio, fim, excludeId))
            throw new ConflictException(
                    "Já existe um compromisso agendado neste horário: "
                            + inicio.toLocalDate() + " " + inicio.toLocalTime()
            );
    }

    private void validarRecorrencia(TipoRecorrencia tipo, Integer quantidade) {
        if (tipo == null)
            throw new BadRequestException("Informe o tipo de recorrência");
        if (quantidade == null || quantidade < 2)
            throw new BadRequestException(
                    "Para compromissos recorrentes, informe a quantidade (mínimo 2)");
    }

    private LocalDateTime proximaOcorrencia(LocalDateTime base, TipoRecorrencia tipo) {
        return switch (tipo) {
            case DIARIO     -> base.plusDays(1);
            case SEMANAL    -> base.plusWeeks(1);
            case QUINZENAL  -> base.plusDays(15);
            case MENSAL     -> addMonthSafe(base);
            case TRIMESTRAL -> addMonthSafeN(base, 3);
            case SEMESTRAL  -> addMonthSafeN(base, 6);
            case ANUAL      -> base.plusYears(1);
        };
    }

    private LocalDateTime addMonthSafe(LocalDateTime base) {
        LocalDate date   = base.toLocalDate();
        int       day    = date.getDayOfMonth();
        LocalDate next   = date.withDayOfMonth(1).plusMonths(1);
        int       maxDay = next.lengthOfMonth();
        return next.withDayOfMonth(Math.min(day, maxDay)).atTime(base.toLocalTime());
    }

    private LocalDateTime addMonthSafeN(LocalDateTime base, int months) {
        LocalDateTime result = base;
        for (int i = 0; i < months; i++) result = addMonthSafe(result);
        return result;
    }

    private LocalDateTime ajustaSeDomingo(LocalDateTime dt) {
        if (dt.getDayOfWeek().getValue() == 7)
            return dt.plusDays(1);
        return dt;
    }
}
