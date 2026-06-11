package com.api.ero_erp.gym.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.gym.dto.*;
import com.api.ero_erp.gym.entity.Exercicio;
import com.api.ero_erp.gym.entity.ItemPlanoTreino;
import com.api.ero_erp.gym.entity.PlanoTreino;
import com.api.ero_erp.gym.mapper.GymMapper;
import com.api.ero_erp.gym.repository.ItemPlanoTreinoRepository;
import com.api.ero_erp.gym.repository.PlanoTreinoRepository;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class PlanoTreinoService {

    private final PlanoTreinoRepository      planoRepository;
    private final ItemPlanoTreinoRepository  itemRepository;
    private final ExercicioService           exercicioService;
    private final PessoaService              pessoaService;
    private final UsuarioService             usuarioService;
    private final SecurityUtils              securityUtils;
    private final WhatsappNotificationService notificationService;

    public PlanoTreinoService(
            PlanoTreinoRepository      planoRepository,
            ItemPlanoTreinoRepository  itemRepository,
            ExercicioService           exercicioService,
            PessoaService              pessoaService,
            UsuarioService             usuarioService,
            SecurityUtils              securityUtils,
            WhatsappNotificationService notificationService
    ) {
        this.planoRepository     = planoRepository;
        this.itemRepository      = itemRepository;
        this.exercicioService    = exercicioService;
        this.pessoaService       = pessoaService;
        this.usuarioService      = usuarioService;
        this.securityUtils       = securityUtils;
        this.notificationService = notificationService;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PlanoTreinoSummaryDto> getAll(Pageable pageable, String nome, Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return planoRepository.findAllWithFilters(pageable, clienteId, nome, pessoaId)
                .map(GymMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public PlanoTreinoResponseDto findByIdResponse(Long id) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        PlanoTreino plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));
        return GymMapper.toResponseDto(plano);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public PlanoTreinoResponseDto create(PlanoTreinoCreateDto dto) {
        Cliente  cliente  = securityUtils.getClienteLogado();
        Pessoa   pessoa   = pessoaService.findById(dto.pessoaId());
        Usuario usuario = dto.usuarioId() != null
                ? usuarioService.findByIdAndClienteId(dto.usuarioId())
                : null;

        PlanoTreino plano = new PlanoTreino();
        plano.setCliente(cliente);
        plano.setPessoa(pessoa);
        plano.setUsuario(usuario);
        plano.setNome(dto.nome());
        plano.setDataInicio(dto.dataInicio());
        plano.setDataFim(dto.dataFim());
        plano.setObservacao(dto.observacao());

        PlanoTreino salvo = planoRepository.save(plano);
        if (dto.ativo() != null) salvo.setAtivo(dto.ativo());

        return GymMapper.toResponseDto(planoRepository.save(salvo));
    }

    @Transactional
    public PlanoTreinoResponseDto update(Long id, PlanoTreinoUpdateDto dto) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        PlanoTreino plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));

        if (dto.pessoaId() != null) {
            plano.setPessoa(pessoaService.findById(dto.pessoaId()));
        }
        plano.setUsuario(dto.usuarioId() != null
                ? usuarioService.findByIdAndClienteId(dto.usuarioId())
                : null);
        if (dto.nome()       != null && !dto.nome().isBlank()) plano.setNome(dto.nome());
        if (dto.dataInicio() != null)                           plano.setDataInicio(dto.dataInicio());
        if (dto.dataFim()    != null)                           plano.setDataFim(dto.dataFim());
        if (dto.observacao() != null)                           plano.setObservacao(dto.observacao());
        if (dto.ativo()      != null)                           plano.setAtivo(dto.ativo());

        return GymMapper.toResponseDto(planoRepository.save(plano));
    }

    @Transactional
    public void delete(Long id) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        PlanoTreino plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));
        planoRepository.delete(plano);
    }

    // ── Itens ─────────────────────────────────────────────────────────────────

    @Transactional
    public ItemPlanoTreinoResponseDto adicionarItem(Long planoId, ItemPlanoTreinoDto dto) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        PlanoTreino plano     = planoRepository.findByIdWithItens(planoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));
        Cliente     cliente   = securityUtils.getClienteLogado();

        Exercicio exercicio = null;
        if (dto.exercicioId() != null) {
            exercicio = exercicioService.findById(dto.exercicioId());
        }

        int ordem = dto.ordem() != null ? dto.ordem()
                : plano.getItens().stream()
                       .filter(i -> i.getDiaSemana() == dto.diaSemana())
                       .mapToInt(ItemPlanoTreino::getOrdem)
                       .max()
                       .orElse(-1) + 1;

        ItemPlanoTreino item = new ItemPlanoTreino();
        item.setCliente(cliente);
        item.setPlano(plano);
        item.setExercicio(exercicio);
        item.setDiaSemana(dto.diaSemana());
        item.setOrdem(ordem);
        item.setSeries(dto.series());
        item.setRepeticoes(dto.repeticoes());
        item.setTipoExecucao(dto.tipoExecucao());
        item.setPausaSegundos(dto.pausaSegundos());
        item.setObservacao(dto.observacao());

        return GymMapper.toItemDto(itemRepository.save(item));
    }

    @Transactional
    public ItemPlanoTreinoResponseDto atualizarItem(Long planoId, Long itemId, ItemPlanoTreinoDto dto) {
        ItemPlanoTreino item = itemRepository.findByIdAndPlanoId(itemId, planoId)
                .orElseThrow(() -> new NotFoundException("Item do plano de treino não encontrado, verifique!"));

        Exercicio exercicio = null;
        if (dto.exercicioId() != null) {
            exercicio = exercicioService.findById(dto.exercicioId());
        }

        item.setDiaSemana(dto.diaSemana());
        if (dto.ordem() != null)         item.setOrdem(dto.ordem());
        item.setExercicio(exercicio);
        item.setSeries(dto.series());
        item.setRepeticoes(dto.repeticoes());
        item.setTipoExecucao(dto.tipoExecucao());
        item.setPausaSegundos(dto.pausaSegundos());
        item.setObservacao(dto.observacao());

        return GymMapper.toItemDto(itemRepository.save(item));
    }

    @Transactional
    public void removerItem(Long planoId, Long itemId) {
        ItemPlanoTreino item = itemRepository.findByIdAndPlanoId(itemId, planoId)
                .orElseThrow(() -> new NotFoundException("Item do plano de treino não encontrado, verifique!"));
        itemRepository.deleteById(item.getId());
    }

    // ── PDF / WhatsApp ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void enviarPdfWhatsapp(Long id, EnviarPdfTreinoDto dto) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        PlanoTreino plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));
        notificationService.enviarPdfParaCliente(
                dto.pessoaId(),
                clienteId,
                securityUtils.getUsuarioIdLogado(),
                dto.pdfBase64(),
                "plano-treino.pdf",
                "Plano de treino: " + plano.getNome()
        );
    }

    @Transactional
    public PlanoTreinoResponseDto clonar(Long id) {
        Long        clienteId = securityUtils.getClienteIdLogado();
        Cliente     cliente   = securityUtils.getClienteLogado();
        PlanoTreino original  = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano de treino não encontrado, verifique!"));

        PlanoTreino copia = new PlanoTreino();
        copia.setCliente(cliente);
        copia.setPessoa(original.getPessoa());
        copia.setUsuario(original.getUsuario());
        copia.setNome(original.getNome() + " (cópia)");
        copia.setDataInicio(original.getDataInicio());
        copia.setDataFim(original.getDataFim());
        copia.setObservacao(original.getObservacao());
        copia.setAtivo(true);
        planoRepository.save(copia);

        List<ItemPlanoTreino> novosItens = original.getItens().stream()
                .map(i -> {
                    ItemPlanoTreino novo = new ItemPlanoTreino();
                    novo.setCliente(cliente);
                    novo.setPlano(copia);
                    novo.setExercicio(i.getExercicio());
                    novo.setDiaSemana(i.getDiaSemana());
                    novo.setOrdem(i.getOrdem());
                    novo.setSeries(i.getSeries());
                    novo.setRepeticoes(i.getRepeticoes());
                    novo.setTipoExecucao(i.getTipoExecucao());
                    novo.setPausaSegundos(i.getPausaSegundos());
                    novo.setObservacao(i.getObservacao());
                    return novo;
                })
                .toList();

        itemRepository.saveAll(novosItens);

        return GymMapper.toResponseDto(planoRepository.findByIdWithItens(copia.getId(), clienteId).orElseThrow());
    }
}
