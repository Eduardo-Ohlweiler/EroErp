package com.api.ero_erp.credito.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.credito.dtos.CreditoClienteResponseDto;
import com.api.ero_erp.credito.entity.CreditoCliente;
import com.api.ero_erp.credito.enums.TipoCredito;
import com.api.ero_erp.credito.mapper.CreditoClienteMapper;
import com.api.ero_erp.credito.repository.CreditoClienteRepository;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class CreditoClienteService {

    private final CreditoClienteRepository repository;
    private final UsuarioService           usuarioService;
    private final SecurityUtils            securityUtils;

    public CreditoClienteService(
            CreditoClienteRepository repository,
            UsuarioService           usuarioService,
            SecurityUtils            securityUtils
    ) {
        this.repository     = repository;
        this.usuarioService = usuarioService;
        this.securityUtils  = securityUtils;
    }

    @Transactional(readOnly = true)
    public BigDecimal saldo(Long pessoaId) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.saldo(clienteId, pessoaId);
    }

    @Transactional(readOnly = true)
    public Page<CreditoClienteResponseDto> getHistorico(Long pessoaId, Pageable pageable) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return repository.findByClienteIdAndPessoaId(clienteId, pessoaId, pageable)
                .map(CreditoClienteMapper::toDto);
    }

    /** Gera crédito (ENTRADA) para a pessoa. Ignora valores não positivos. */
    @Transactional
    public void gerarCredito(Pessoa pessoa, BigDecimal valor, String origem, Long pedidoId) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) return;
        registrar(pessoa, TipoCredito.ENTRADA, valor, origem, pedidoId, null);
    }

    /** Consome crédito (USO) da pessoa. Valida saldo suficiente. Ignora valores não positivos. */
    @Transactional
    public void usarCredito(Pessoa pessoa, BigDecimal valor, String origem, Long pedidoId, Long contaReceberId) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) return;
        Long clienteId = securityUtils.getClienteIdLogado();
        BigDecimal saldo = repository.saldo(clienteId, pessoa.getId());
        if (saldo.compareTo(valor) < 0)
            throw new BadRequestException(
                    "Crédito insuficiente para o cliente: disponível " + saldo + ", solicitado " + valor);
        registrar(pessoa, TipoCredito.USO, valor, origem, pedidoId, contaReceberId);
    }

    private void registrar(Pessoa pessoa, TipoCredito tipo, BigDecimal valor,
                           String origem, Long pedidoId, Long contaReceberId) {
        Cliente cliente = securityUtils.getClienteLogado();
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        CreditoCliente c = new CreditoCliente();
        c.setCliente(cliente);
        c.setPessoa(pessoa);
        c.setTipo(tipo);
        c.setValor(valor);
        c.setOrigem(origem);
        c.setPedidoId(pedidoId);
        c.setContaReceberId(contaReceberId);
        c.setData(LocalDateTime.now());
        c.setCreatedBy(usuario);
        repository.save(c);
    }
}
