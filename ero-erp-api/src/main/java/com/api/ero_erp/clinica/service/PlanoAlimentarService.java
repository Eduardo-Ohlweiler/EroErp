package com.api.ero_erp.clinica.service;

import com.api.ero_erp.clinica.dto.*;
import com.api.ero_erp.clinica.entity.ItemPlanoAlimentar;
import com.api.ero_erp.clinica.entity.PlanoAlimentar;
import com.api.ero_erp.clinica.entity.Refeicao;
import com.api.ero_erp.clinica.mapper.PlanoAlimentarMapper;
import com.api.ero_erp.clinica.repository.ItemPlanoAlimentarRepository;
import com.api.ero_erp.clinica.repository.PlanoAlimentarRepository;
import com.api.ero_erp.clinica.repository.RefeicaoRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.service.EmitenteService;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.service.PessoaService;
import com.api.ero_erp.whatsapp.service.WhatsappNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

@Service
public class PlanoAlimentarService {

    private final PlanoAlimentarRepository     planoRepository;
    private final ItemPlanoAlimentarRepository itemRepository;
    private final RefeicaoRepository           refeicaoRepository;
    private final PessoaService                pessoaService;
    private final EmitenteService              emitenteService;
    private final SecurityUtils                securityUtils;
    private final WhatsappNotificationService  notificationService;

    public PlanoAlimentarService(
            PlanoAlimentarRepository     planoRepository,
            ItemPlanoAlimentarRepository itemRepository,
            RefeicaoRepository           refeicaoRepository,
            PessoaService                pessoaService,
            EmitenteService              emitenteService,
            SecurityUtils                securityUtils,
            WhatsappNotificationService  notificationService
    ) {
        this.planoRepository    = planoRepository;
        this.itemRepository     = itemRepository;
        this.refeicaoRepository = refeicaoRepository;
        this.pessoaService      = pessoaService;
        this.emitenteService    = emitenteService;
        this.securityUtils      = securityUtils;
        this.notificationService = notificationService;
    }

    // ── Leitura ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PlanoAlimentarSummaryDto> getAll(Pageable pageable, String nome, Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return planoRepository.findAllWithFilters(pageable, clienteId, nome, pessoaId)
                .map(PlanoAlimentarMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponseDto findByIdResponse(Long id) {
        Long         clienteId = securityUtils.getClienteIdLogado();
        PlanoAlimentar plano   = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));
        return PlanoAlimentarMapper.toResponseDto(plano);
    }

    // ── Escrita ───────────────────────────────────────────────────────────────

    @Transactional
    public PlanoAlimentarResponseDto create(PlanoAlimentarCreateDto dto) {
        Cliente  cliente  = securityUtils.getClienteLogado();
        Pessoa   pessoa   = pessoaService.findById(dto.pessoaId());
        Emitente emitente = dto.emitenteId() != null
                ? emitenteService.findById(dto.emitenteId())
                : null;

        PlanoAlimentar plano = new PlanoAlimentar();
        plano.setCliente(cliente);
        plano.setPessoa(pessoa);
        plano.setEmitente(emitente);
        plano.setNome(dto.nome());
        plano.setDataInicio(dto.dataInicio());
        plano.setDataFim(dto.dataFim());
        plano.setObservacao(dto.observacao());

        PlanoAlimentar salvo = planoRepository.save(plano);
        if (dto.ativo() != null) salvo.setAtivo(dto.ativo());

        return PlanoAlimentarMapper.toResponseDto(planoRepository.save(salvo));
    }

    @Transactional
    public PlanoAlimentarResponseDto update(Long id, PlanoAlimentarUpdateDto dto) {
        Long           clienteId = securityUtils.getClienteIdLogado();
        PlanoAlimentar plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));

        if (dto.pessoaId() != null) {
            Pessoa pessoa = pessoaService.findById(dto.pessoaId());
            plano.setPessoa(pessoa);
        }
        if (dto.emitenteId() != null) {
            Emitente emitente = emitenteService.findById(dto.emitenteId());
            plano.setEmitente(emitente);
        }
        if (dto.nome() != null && !dto.nome().isBlank())  plano.setNome(dto.nome());
        if (dto.dataInicio() != null)                      plano.setDataInicio(dto.dataInicio());
        if (dto.dataFim() != null)                         plano.setDataFim(dto.dataFim());
        if (dto.observacao() != null)                      plano.setObservacao(dto.observacao());
        if (dto.ativo() != null)                           plano.setAtivo(dto.ativo());

        return PlanoAlimentarMapper.toResponseDto(planoRepository.save(plano));
    }

    @Transactional
    public void delete(Long id) {
        Long           clienteId = securityUtils.getClienteIdLogado();
        PlanoAlimentar plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));
        planoRepository.delete(plano);
    }

    // ── Itens ─────────────────────────────────────────────────────────────────

    @Transactional
    public ItemPlanoAlimentarResponseDto adicionarItem(Long planoId, ItemPlanoAlimentarDto dto) {
        Long           clienteId = securityUtils.getClienteIdLogado();
        PlanoAlimentar plano     = planoRepository.findByIdWithItens(planoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));
        Cliente        cliente   = securityUtils.getClienteLogado();

        Refeicao refeicao = null;
        if (dto.refeicaoId() != null) {
            refeicao = refeicaoRepository.findByIdAndClienteId(dto.refeicaoId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));
        }

        ItemPlanoAlimentar item = new ItemPlanoAlimentar();
        item.setCliente(cliente);
        item.setPlano(plano);
        item.setRefeicao(refeicao);
        item.setDiaSemana(dto.diaSemana());
        item.setHorario(LocalTime.parse(dto.horario()));
        item.setQuantidade(dto.quantidade());
        item.setPeso(dto.peso());
        item.setObservacao(dto.observacao());

        return PlanoAlimentarMapper.toItemDto(itemRepository.save(item));
    }

    @Transactional
    public ItemPlanoAlimentarResponseDto atualizarItem(Long planoId, Long itemId, ItemPlanoAlimentarDto dto) {
        Long               clienteId = securityUtils.getClienteIdLogado();
        ItemPlanoAlimentar item      = itemRepository.findByIdAndPlanoId(itemId, planoId)
                .orElseThrow(() -> new NotFoundException("Item do plano alimentar não encontrado, verifique!"));

        Refeicao refeicao = null;
        if (dto.refeicaoId() != null) {
            refeicao = refeicaoRepository.findByIdAndClienteId(dto.refeicaoId(), clienteId)
                    .orElseThrow(() -> new NotFoundException("Refeição não encontrada, verifique!"));
        }

        item.setDiaSemana(dto.diaSemana());
        item.setHorario(LocalTime.parse(dto.horario()));
        item.setRefeicao(refeicao);
        item.setQuantidade(dto.quantidade());
        item.setPeso(dto.peso());
        item.setObservacao(dto.observacao());

        return PlanoAlimentarMapper.toItemDto(itemRepository.save(item));
    }

    @Transactional
    public void removerItem(Long planoId, Long itemId) {
        ItemPlanoAlimentar item = itemRepository.findByIdAndPlanoId(itemId, planoId)
                .orElseThrow(() -> new NotFoundException("Item do plano alimentar não encontrado, verifique!"));
        itemRepository.deleteById(item.getId());
    }

    // ── PDF / WhatsApp ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void enviarPdfWhatsapp(Long id, EnviarPdfPlanoDto dto) {
        Long           clienteId = securityUtils.getClienteIdLogado();
        PlanoAlimentar plano     = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));
        notificationService.enviarPdfParaCliente(
                dto.pessoaId(),
                clienteId,
                securityUtils.getUsuarioIdLogado(),
                dto.pdfBase64(),
                "plano-alimentar.pdf",
                "Plano alimentar: " + plano.getNome()
        );
    }

    @Transactional
    public PlanoAlimentarResponseDto clonar(Long id) {
        Long           clienteId = securityUtils.getClienteIdLogado();
        Cliente        cliente   = securityUtils.getClienteLogado();
        PlanoAlimentar original  = planoRepository.findByIdWithItens(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Plano alimentar não encontrado, verifique!"));

        PlanoAlimentar copia = new PlanoAlimentar();
        copia.setCliente(cliente);
        copia.setPessoa(original.getPessoa());
        copia.setEmitente(original.getEmitente());
        copia.setNome(original.getNome() + " (cópia)");
        copia.setDataInicio(original.getDataInicio());
        copia.setDataFim(original.getDataFim());
        copia.setObservacao(original.getObservacao());
        copia.setAtivo(true);
        planoRepository.save(copia);

        java.util.List<ItemPlanoAlimentar> novosItens = original.getItens().stream()
                .map(i -> {
                    ItemPlanoAlimentar novo = new ItemPlanoAlimentar();
                    novo.setCliente(cliente);
                    novo.setPlano(copia);
                    novo.setRefeicao(i.getRefeicao());
                    novo.setDiaSemana(i.getDiaSemana());
                    novo.setHorario(i.getHorario());
                    novo.setQuantidade(i.getQuantidade());
                    novo.setPeso(i.getPeso());
                    novo.setObservacao(i.getObservacao());
                    return novo;
                })
                .toList();

        itemRepository.saveAll(novosItens);

        return PlanoAlimentarMapper.toResponseDto(planoRepository.findByIdWithItens(copia.getId(), clienteId).orElseThrow());
    }
}
