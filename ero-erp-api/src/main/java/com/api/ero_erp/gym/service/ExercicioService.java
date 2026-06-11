package com.api.ero_erp.gym.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.gym.dto.ExercicioCreateDto;
import com.api.ero_erp.gym.dto.ExercicioResponseDto;
import com.api.ero_erp.gym.dto.ExercicioSummaryDto;
import com.api.ero_erp.gym.entity.Exercicio;
import com.api.ero_erp.gym.mapper.GymMapper;
import com.api.ero_erp.gym.repository.ExercicioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExercicioService {

    private final ExercicioRepository exercicioRepository;
    private final SecurityUtils       securityUtils;

    public ExercicioService(ExercicioRepository exercicioRepository, SecurityUtils securityUtils) {
        this.exercicioRepository = exercicioRepository;
        this.securityUtils       = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<ExercicioSummaryDto> getAll(Pageable pageable, String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return exercicioRepository.findAllWithFilters(pageable, clienteId, nome)
                .map(GymMapper::toSummaryDto);
    }

    @Transactional(readOnly = true)
    public ExercicioResponseDto findByIdResponse(Long id) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Exercicio exercicio = exercicioRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exercício não encontrado, verifique!"));
        return GymMapper.toResponseDto(exercicio);
    }

    @Transactional(readOnly = true)
    public List<ExercicioSummaryDto> findAtivos() {
        Long clienteId = securityUtils.getClienteIdLogado();
        return exercicioRepository.findByClienteIdAndAtivoTrue(clienteId)
                .stream()
                .map(GymMapper::toSummaryDto)
                .toList();
    }

    @Transactional
    public ExercicioResponseDto create(ExercicioCreateDto dto) {
        Cliente   cliente   = securityUtils.getClienteLogado();
        Exercicio exercicio = new Exercicio();
        exercicio.setCliente(cliente);
        exercicio.setNome(dto.nome());
        exercicio.setDescricao(dto.descricao());

        Exercicio salvo = exercicioRepository.save(exercicio);
        if (dto.ativo() != null) salvo.setAtivo(dto.ativo());

        return GymMapper.toResponseDto(exercicioRepository.save(salvo));
    }

    @Transactional
    public ExercicioResponseDto update(Long id, ExercicioCreateDto dto) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Exercicio exercicio = exercicioRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exercício não encontrado, verifique!"));

        if (dto.nome()      != null && !dto.nome().isBlank()) exercicio.setNome(dto.nome());
        if (dto.descricao() != null)                           exercicio.setDescricao(dto.descricao());
        if (dto.ativo()     != null)                           exercicio.setAtivo(dto.ativo());

        return GymMapper.toResponseDto(exercicioRepository.save(exercicio));
    }

    @Transactional
    public void delete(Long id) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Exercicio exercicio = exercicioRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exercício não encontrado, verifique!"));
        exercicioRepository.delete(exercicio);
    }

    public Exercicio findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return exercicioRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Exercício não encontrado, verifique!"));
    }
}
