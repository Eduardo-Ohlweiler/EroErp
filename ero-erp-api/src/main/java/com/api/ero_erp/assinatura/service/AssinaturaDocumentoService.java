package com.api.ero_erp.assinatura.service;

import com.api.ero_erp.assinatura.dtos.AssinaturaDocumentoResponseDto;
import com.api.ero_erp.assinatura.dtos.AssinaturaPublicResponseDto;
import com.api.ero_erp.assinatura.dtos.SolicitarAssinaturaResponseDto;
import com.api.ero_erp.assinatura.entity.AssinaturaDocumento;
import com.api.ero_erp.assinatura.entity.AssinaturaStatus;
import com.api.ero_erp.assinatura.mapper.AssinaturaDocumentoMapper;
import com.api.ero_erp.assinatura.repository.AssinaturaDocumentoRepository;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.documento.entity.Documento;
import com.api.ero_erp.documento.service.DocumentoService;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AssinaturaDocumentoService {

    private final AssinaturaDocumentoRepository repository;
    private final DocumentoService              documentoService;
    private final ClienteService                clienteService;
    private final SecurityUtils                 securityUtils;

    public AssinaturaDocumentoService(
            AssinaturaDocumentoRepository repository,
            DocumentoService              documentoService,
            ClienteService                clienteService,
            SecurityUtils                 securityUtils
    ) {
        this.repository      = repository;
        this.documentoService = documentoService;
        this.clienteService  = clienteService;
        this.securityUtils   = securityUtils;
    }

    @Transactional
    public SolicitarAssinaturaResponseDto solicitarAssinatura(Long documentoId) {
        Long      clienteId = securityUtils.getClienteIdLogado();
        Documento documento = documentoService.findById(documentoId);
        Cliente   cliente   = clienteService.findById(clienteId);

        // Invalida assinaturas PENDENTE ou ASSINADO anteriores
        List<AssinaturaDocumento> anteriores = repository
                .findByDocumentoIdAndClienteIdAndStatusIn(documentoId, clienteId,
                        List.of(AssinaturaStatus.PENDENTE, AssinaturaStatus.ASSINADO));
        anteriores.forEach(a -> a.setStatus(AssinaturaStatus.REJEITADO));
        repository.saveAll(anteriores);

        AssinaturaDocumento nova = new AssinaturaDocumento();
        nova.setCliente(cliente);
        nova.setDocumento(documento);
        nova.setToken(UUID.randomUUID().toString());
        nova.setStatus(AssinaturaStatus.PENDENTE);

        return AssinaturaDocumentoMapper.toSolicitarDto(repository.save(nova));
    }

    @Transactional(readOnly = true)
    public AssinaturaDocumentoResponseDto getAssinatura(Long documentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository
                .findFirstByDocumentoIdAndClienteIdOrderByCreatedAtDesc(documentoId, clienteId)
                .map(AssinaturaDocumentoMapper::toDto)
                .orElse(null);
    }

    @Transactional
    public AssinaturaDocumentoResponseDto aceitar(Long documentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AssinaturaDocumento assinatura = repository
                .findFirstByDocumentoIdAndClienteIdOrderByCreatedAtDesc(documentoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Assinatura não encontrada"));

        if (assinatura.getStatus() != AssinaturaStatus.ASSINADO) {
            throw new BadRequestException("Somente assinaturas com status ASSINADO podem ser aceitas");
        }

        assinatura.setStatus(AssinaturaStatus.ACEITO);
        return AssinaturaDocumentoMapper.toDto(repository.save(assinatura));
    }

    @Transactional
    public AssinaturaDocumentoResponseDto rejeitar(Long documentoId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        AssinaturaDocumento assinatura = repository
                .findFirstByDocumentoIdAndClienteIdOrderByCreatedAtDesc(documentoId, clienteId)
                .orElseThrow(() -> new NotFoundException("Assinatura não encontrada"));

        assinatura.setStatus(AssinaturaStatus.REJEITADO);
        return AssinaturaDocumentoMapper.toDto(repository.save(assinatura));
    }

    // === MÉTODOS PÚBLICOS (sem autenticação) ===

    @Transactional(readOnly = true)
    public AssinaturaPublicResponseDto getByToken(String token) {
        AssinaturaDocumento assinatura = repository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Link de assinatura inválido ou expirado"));

        String nomeDocumento = "Documento #" + assinatura.getDocumento().getId();
        String nomeCliente   = assinatura.getDocumento().getClientePessoa().getNome();

        return AssinaturaDocumentoMapper.toPublicDto(assinatura, nomeDocumento, nomeCliente);
    }

    @Transactional
    public void submeterAssinatura(String token, String dadosAssinatura, String ipAssinante) {
        AssinaturaDocumento assinatura = repository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Link de assinatura inválido ou expirado"));

        if (assinatura.getStatus() != AssinaturaStatus.PENDENTE) {
            throw new BadRequestException("Este link já foi utilizado ou foi invalidado");
        }

        if (dadosAssinatura == null || dadosAssinatura.isBlank()) {
            throw new BadRequestException("Dados da assinatura são obrigatórios");
        }

        assinatura.setDadosAssinatura(dadosAssinatura);
        assinatura.setIpAssinante(ipAssinante);
        assinatura.setDataAssinatura(LocalDateTime.now());
        assinatura.setStatus(AssinaturaStatus.ASSINADO);

        repository.save(assinatura);
    }
}
