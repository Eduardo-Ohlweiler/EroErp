package com.api.ero_erp.cliente.service;

import com.api.ero_erp.cliente.dtos.ClienteCreateDto;
import com.api.ero_erp.cliente.dtos.ClienteUpdateDto;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.repository.ClienteRepository;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public Cliente findById(Long id) throws NotFoundException {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado, verifique!"));
    }

    @Transactional(readOnly = true)
    public Page<Cliente> getAll(Pageable pageable, String nome, String email) {
        return clienteRepository.findAllWithFilters(pageable, nome, email);
    }

    @Transactional
    public Cliente create(ClienteCreateDto dto){
        if(this.clienteRepository.existsByEmailIgnoreCase(dto.email()))
            throw new ConflictException("Já existe cliente cadastrado com esse email, verifique!");

        Cliente cliente = new Cliente();
        cliente.setNome(dto.nome());
        cliente.setEmail(dto.email());
        cliente.setTelefone(dto.telefone());

        return this.clienteRepository.save(cliente);
    }

    @Transactional
    public Cliente update(Long id, ClienteUpdateDto dto){

        Cliente cliente = this.findById(id);

        if(dto.email() != null && !dto.email().isBlank()){
            Optional<Cliente> salvo = this.clienteRepository.findByEmailIgnoreCase(dto.email());
            if(salvo.isPresent() && !salvo.get().getId().equals(id))
                throw  new ConflictException("Já existe cliente cadastrado com esse email, verifique!");

            cliente.setEmail(dto.email());
        }
        if(dto.nome() != null && !dto.nome().isBlank())
            cliente.setNome(dto.nome());
        if(dto.telefone()  != null && !dto.telefone().isBlank())
            cliente.setTelefone(dto.telefone());
        if(dto.ativo() != null)
            cliente.setAtivo(dto.ativo());

        return this.clienteRepository.save(cliente);
    }
}
