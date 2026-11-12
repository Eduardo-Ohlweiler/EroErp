package com.api.ero_api.tenant.service;

import com.api.ero_api.compartilhado.exception.NaoEncontradoException;
import com.api.ero_api.tenant.entity.Tenant;
import com.api.ero_api.tenant.repository.TenantRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Limite de usuários ativos do contratante, lido com a linha do contratante
 * travada (SELECT ... FOR UPDATE): dois cadastros ao mesmo tempo não passam os
 * dois pela última vaga.
 *
 * <p>Separado do TenantService para não depender do UsuarioService: assim o
 * UsuarioService pode chamá-lo (criar e reativar usuário) sem ciclo.
 */
@Service
public class LimiteUsuariosService {

    private final TenantRepository repository;

    public LimiteUsuariosService(TenantRepository repository) {
        this.repository = repository;
    }

    /**
     * Trava o contratante até o fim da transação de quem chama e devolve o limite
     * ({@code null} = sem limite, caso da Plataforma).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Integer travarELerLimite(UUID tenantId) {
        return repository.buscarPorIdComBloqueio(tenantId)
                .map(Tenant::getLimiteUsuarios)
                .orElseThrow(() -> new NaoEncontradoException("Contratante não encontrado."));
    }
}
