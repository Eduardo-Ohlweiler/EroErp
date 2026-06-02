package com.api.ero_erp.marca.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.marca.dtos.MarcaCreateDto;
import com.api.ero_erp.marca.dtos.MarcaResponseDto;
import com.api.ero_erp.marca.dtos.MarcaUpdateDto;
import com.api.ero_erp.marca.entity.Marca;
import com.api.ero_erp.marca.mapper.MarcaMapper;
import com.api.ero_erp.marca.repository.MarcaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;
    private final ClienteService  clienteService;
    private final MarcaMapper     marcaMapper;
    private final SecurityUtils   securityUtils;

    public MarcaService(
            MarcaRepository marcaRepository,
            ClienteService  clienteService,
            MarcaMapper     marcaMapper,
            SecurityUtils   securityUtils
    ) {
        this.marcaRepository = marcaRepository;
        this.clienteService  = clienteService;
        this.marcaMapper     = marcaMapper;
        this.securityUtils   = securityUtils;
    }

    @Transactional(readOnly = true)
    public Marca findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return marcaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Marca não encontrada"));
    }

    @Transactional(readOnly = true)
    public MarcaResponseDto findByIdResponse(Long id) {
        return marcaMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<MarcaResponseDto> getAll(Pageable pageable, Boolean ativo, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return marcaRepository.findAllWithFilters(pageable, clienteId, ativo, nome)
                .map(marcaMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<MarcaResponseDto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return marcaRepository.findForSelect(clienteId, nome)
                .stream()
                .map(marcaMapper::toDto)
                .toList();
    }

    @Transactional
    public MarcaResponseDto create(MarcaCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        if (marcaRepository.existsByNomeAndClienteId(dto.nome(), clienteId, null))
            throw new ConflictException("Já existe uma marca com o nome \"" + dto.nome() + "\"");

        Marca marca = new Marca();
        marca.setCliente(cliente);
        marca.setNome(dto.nome());

        return marcaMapper.toDto(marcaRepository.save(marca));
    }

    @Transactional
    public MarcaResponseDto update(Long id, MarcaUpdateDto dto) {
        Long  clienteId = securityUtils.getClienteIdLogado();
        Marca marca     = findById(id);

        if (marcaRepository.existsByNomeAndClienteId(dto.nome(), clienteId, id))
            throw new ConflictException("Já existe uma marca com o nome \"" + dto.nome() + "\"");

        marca.setNome(dto.nome());
        marca.setAtivo(dto.ativo());
        return marcaMapper.toDto(marcaRepository.save(marca));
    }

    @Transactional
    public void delete(Long id) {
        marcaRepository.delete(findById(id));
    }
}
