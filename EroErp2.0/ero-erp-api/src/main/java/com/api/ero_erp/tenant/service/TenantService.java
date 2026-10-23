package com.api.ero_erp.tenant.service;

import com.api.ero_erp.config.PageableUtils;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.tenant.dtos.TenantCreateDto;
import com.api.ero_erp.tenant.dtos.TenantResponseDto;
import com.api.ero_erp.tenant.dtos.TenantSelectDto;
import com.api.ero_erp.tenant.dtos.TenantUpdateDto;
import com.api.ero_erp.tenant.entity.Tenant;
import com.api.ero_erp.tenant.enums.PaletaSistema;
import com.api.ero_erp.tenant.enums.PeriodoAcesso;
import com.api.ero_erp.tenant.mapper.TenantMapper;
import com.api.ero_erp.tenant.repository.TenantRepository;
import com.api.ero_erp.usuario.enums.Role;
import com.api.ero_erp.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${app.acesso.fuso-horario:America/Sao_Paulo}")
    private String fusoHorario;

    @Transactional(readOnly = true)
    public Page<TenantResponseDto> getAll(Pageable pageable, String nome, Boolean ativo,
                                          Integer expirandoEmDias) {
        return tenantRepository
                .findAllWithFilters(PageableUtils.semOrdenacao(pageable), nome, ativo, expirandoEmDias)
                .map(TenantMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<TenantSelectDto> select(String nome) {
        return tenantRepository.findForSelect(nome).stream()
                .map(TenantMapper::toSelect)
                .toList();
    }

    @Transactional(readOnly = true)
    public TenantResponseDto findByIdResponse(UUID id) {
        return TenantMapper.toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public Tenant findById(UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
    }

    @Transactional
    public TenantResponseDto update(UUID id, TenantUpdateDto dto) {
        Tenant tenant = findById(id);
        tenant.setNome(dto.nome());
        return TenantMapper.toResponse(tenantRepository.save(tenant));
    }

    @Transactional
    public TenantResponseDto alterarAtivo(UUID id, boolean ativo) {
        Tenant tenant = findById(id);

        // Reativar sem renovar seria desfeito pela rotina na madrugada seguinte:
        // o superadmin acharia que resolveu e o cliente perderia o acesso outra vez.
        if (ativo && tenant.acessoExpirado())
            throw new ConflictException("Renove o período de acesso para reativar este cliente");

        // O superadmin só existe no tenant do sistema, e tenant inativo barra
        // o login e derruba os tokens: desligá-lo não teria volta pela API.
        if (!ativo && usuarioRepository.existsByTenantIdAndRole(id, Role.SUPERADMIN))
            throw new ConflictException(
                    "Este é o tenant do sistema: desativá-lo trancaria todos os superadmins para fora");

        tenant.setAtivo(ativo);
        log.info("Tenant {} alterado para ativo={}", id, ativo);
        return TenantMapper.toResponse(tenantRepository.save(tenant));
    }

    /**
     * Define — ou renova — o período de acesso, sempre recontado a partir de
     * hoje.
     *
     * <p>Reativa junto quando o cliente estava desligado com o prazo vencido:
     * é exatamente a operação "pagou, volta a ter acesso". Um tenant desativado
     * à mão, sem prazo vencido, continua desativado — desligar foi decisão de
     * alguém, e renovar contrato não a desfaz.
     */
    @Transactional
    public TenantResponseDto definirAcesso(UUID id, PeriodoAcesso periodo) {
        Tenant tenant = findById(id);
        boolean reativando = !Boolean.TRUE.equals(tenant.getAtivo()) && tenant.acessoExpirado();

        aplicarPeriodo(tenant, periodo);

        if (reativando) tenant.setAtivo(true);

        log.info("Tenant {} com período de acesso {} até {}{}",
                id, periodo, tenant.getAcessoExpiraEm(), reativando ? " (reativado)" : "");

        return TenantMapper.toResponse(tenantRepository.save(tenant));
    }

    /**
     * Troca a paleta do tenant. Vale a partir da próxima sessão de cada usuário
     * dele — login, refresh ou troca de tenant —, porque a cor viaja na
     * resposta de autenticação, não numa consulta à parte.
     */
    @Transactional
    public TenantResponseDto definirPaleta(UUID id, PaletaSistema paleta) {
        Tenant tenant = findById(id);
        tenant.setPaleta(paleta);
        log.info("Tenant {} com paleta {}", id, paleta);
        return TenantMapper.toResponse(tenantRepository.save(tenant));
    }

    /**
     * Tenant aberto pela tela de tenants, sem usuário. O outro caminho — o
     * cliente nascer junto com o primeiro usuário — passa por
     * {@link #criar(String, PeriodoAcesso)}, chamado de {@code UsuarioService}.
     */
    @Transactional
    public TenantResponseDto criar(TenantCreateDto dto) {
        Tenant tenant = criar(dto.nome(), dto.periodoAcesso());
        if (dto.paleta() != null) tenant.setPaleta(dto.paleta());
        tenant = tenantRepository.save(tenant);
        log.info("Tenant {} criado pela tela de tenants: período {}, paleta {}",
                tenant.getId(), tenant.getPeriodoAcesso(), tenant.getPaleta());
        return TenantMapper.toResponse(tenant);
    }

    @Transactional
    public Tenant criar(String nome, PeriodoAcesso periodo) {
        Tenant tenant = new Tenant(nome);
        aplicarPeriodo(tenant, periodo != null ? periodo : PeriodoAcesso.INDETERMINADO);
        return tenantRepository.save(tenant);
    }

    /** Chamado pela rotina diária. Devolve quantos clientes foram desligados. */
    @Transactional
    public int inativarExpirados(Instant agora) {
        return tenantRepository.inativarExpirados(agora);
    }

    private void aplicarPeriodo(Tenant tenant, PeriodoAcesso periodo) {
        ZoneId zona = ZoneId.of(fusoHorario);
        tenant.setPeriodoAcesso(periodo);
        tenant.setAcessoExpiraEm(periodo.expiracaoAPartirDe(LocalDate.now(zona), zona));
    }
}
