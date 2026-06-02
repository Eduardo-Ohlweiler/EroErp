package com.api.ero_erp.categoria.service;

import com.api.ero_erp.categoria.dtos.CategoriaCreateDto;
import com.api.ero_erp.categoria.dtos.CategoriaResponseDto;
import com.api.ero_erp.categoria.dtos.CategoriaUpdateDto;
import com.api.ero_erp.categoria.entity.Categoria;
import com.api.ero_erp.categoria.mapper.CategoriaMapper;
import com.api.ero_erp.categoria.repository.CategoriaRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ClienteService      clienteService;
    private final CategoriaMapper     categoriaMapper;
    private final SecurityUtils       securityUtils;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            ClienteService      clienteService,
            CategoriaMapper     categoriaMapper,
            SecurityUtils       securityUtils
    ) {
        this.categoriaRepository = categoriaRepository;
        this.clienteService      = clienteService;
        this.categoriaMapper     = categoriaMapper;
        this.securityUtils       = securityUtils;
    }

    @Transactional(readOnly = true)
    public Categoria findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return categoriaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
    }

    @Transactional(readOnly = true)
    public CategoriaResponseDto findByIdResponse(Long id) {
        return categoriaMapper.toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public Page<CategoriaResponseDto> getAll(Pageable pageable, Boolean ativo, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return categoriaRepository.findAllWithFilters(pageable, clienteId, ativo, nome)
                .map(categoriaMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponseDto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return categoriaRepository.findForSelect(clienteId, nome)
                .stream()
                .map(categoriaMapper::toDto)
                .toList();
    }

    @Transactional
    public CategoriaResponseDto create(CategoriaCreateDto dto) {
        Long    clienteId = securityUtils.getClienteIdLogado();
        Cliente cliente   = clienteService.findById(clienteId);

        if (categoriaRepository.existsByNomeAndClienteId(dto.nome(), clienteId, null))
            throw new ConflictException("Já existe uma categoria com o nome \"" + dto.nome() + "\"");

        Categoria categoria = new Categoria();
        categoria.setCliente(cliente);
        categoria.setNome(dto.nome());

        return categoriaMapper.toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponseDto update(Long id, CategoriaUpdateDto dto) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Categoria categoria = findById(id);

        if (categoriaRepository.existsByNomeAndClienteId(dto.nome(), clienteId, id))
            throw new ConflictException("Já existe uma categoria com o nome \"" + dto.nome() + "\"");

        categoria.setNome(dto.nome());
        categoria.setAtivo(dto.ativo());
        return categoriaMapper.toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public void delete(Long id) {
        categoriaRepository.delete(findById(id));
    }
}
