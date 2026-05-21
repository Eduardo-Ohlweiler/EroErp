package com.api.ero_erp.emitente.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.emitente.dtos.EmitenteCreateDto;
import com.api.ero_erp.emitente.dtos.EmitenteResponseDto;
import com.api.ero_erp.emitente.dtos.EmitenteUpdateDto;
import com.api.ero_erp.emitente.entity.Emitente;
import com.api.ero_erp.emitente.enums.TipoEmitente;
import com.api.ero_erp.emitente.mapper.EmitenteMapper;
import com.api.ero_erp.emitente.repository.EmitenteRepository;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmitenteService {

    private final EmitenteRepository emitenteRepository;
    private final PessoaRepository   pessoaRepository;
    private final ClienteService      clienteService;
    private final EmitenteMapper      emitenteMapper;
    private final SecurityUtils       securityUtils;

    public EmitenteService(
            EmitenteRepository emitenteRepository,
            PessoaRepository   pessoaRepository,
            ClienteService     clienteService,
            EmitenteMapper     emitenteMapper,
            SecurityUtils      securityUtils
    ) {
        this.emitenteRepository = emitenteRepository;
        this.pessoaRepository   = pessoaRepository;
        this.clienteService     = clienteService;
        this.emitenteMapper     = emitenteMapper;
        this.securityUtils      = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<EmitenteResponseDto> getAll(Pageable pageable, Boolean bloqueado, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return emitenteRepository.findAllWithFilters(pageable, clienteId, bloqueado, nome)
                .map(emitenteMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public List<EmitenteResponseDto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return emitenteRepository.findForSelect(clienteId, nome)
                .stream()
                .map(emitenteMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Emitente findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return emitenteRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Emitente não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public EmitenteResponseDto findByIdResponse(Long id) {
        return emitenteMapper.toDTO(this.findById(id));
    }

    @Transactional
    public EmitenteResponseDto create(EmitenteCreateDto dto) {

        Cliente cliente = clienteService.findById(securityUtils.getClienteIdLogado());
        if (!Boolean.TRUE.equals(cliente.getAtivo()))
            throw new ConflictException("Cliente inativo, verifique!");

        Pessoa pessoa = buscarPessoa(dto.pessoaId(), cliente.getId());

        if (!Boolean.TRUE.equals(pessoa.getAtivo()))
            throw new ConflictException("Pessoa inativa e não pode ser vinculada a um emitente, verifique!");

        if (emitenteRepository.existsByPessoaId(dto.pessoaId(), null))
            throw new ConflictException("Essa pessoa já está vinculada a outro emitente, verifique!");

        Pessoa pessoaMatriz = resolverPessoaMatriz(dto.tipo(), dto.pessoaMatrizId(), cliente.getId());

        Emitente emitente = Emitente.builder()
                .cliente(cliente)
                .pessoa(pessoa)
                .tipo(dto.tipo())
                .pessoaMatriz(pessoaMatriz)
                .cor(dto.cor())
                .build();

        return emitenteMapper.toDTO(emitenteRepository.save(emitente));
    }

    @Transactional
    public EmitenteResponseDto update(Long id, EmitenteUpdateDto dto) {

        Emitente emitente  = this.findById(id);
        Long     clienteId = emitente.getCliente().getId();

        if (!emitente.getPessoa().getId().equals(dto.pessoaId())) {
            Pessoa novaPessoa = buscarPessoa(dto.pessoaId(), clienteId);

            if (!Boolean.TRUE.equals(novaPessoa.getAtivo()))
                throw new ConflictException("Pessoa inativa e não pode ser vinculada a um emitente, verifique!");

            if (emitenteRepository.existsByPessoaId(dto.pessoaId(), id))
                throw new ConflictException("Essa pessoa já está vinculada a outro emitente, verifique!");

            emitente.setPessoa(novaPessoa);
        }

        Pessoa pessoaMatriz = resolverPessoaMatriz(dto.tipo(), dto.pessoaMatrizId(), clienteId);

        emitente.setTipo(dto.tipo());
        emitente.setPessoaMatriz(pessoaMatriz);
        emitente.setCor(dto.cor());
        emitente.setBloqueado(dto.bloqueado());

        return emitenteMapper.toDTO(emitenteRepository.save(emitente));
    }

    @Transactional
    public void delete(Long id) {
        emitenteRepository.delete(this.findById(id));
    }

    private Pessoa buscarPessoa(Long pessoaId, Long clienteId) {
        return pessoaRepository.findByIdAndClienteId(pessoaId, clienteId)
                .orElseThrow(() -> new NotFoundException("Pessoa não encontrada, verifique!"));
    }

    private Pessoa resolverPessoaMatriz(TipoEmitente tipo, Long pessoaMatrizId, Long clienteId) {
        if (tipo == TipoEmitente.FILIAL) {
            if (pessoaMatrizId == null)
                throw new ConflictException("pessoaMatrizId é obrigatório para emitentes do tipo FILIAL, verifique!");
            return buscarPessoa(pessoaMatrizId, clienteId);
        }
        return null;
    }
}