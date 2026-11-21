package com.api.ero_api.auxiliar.service;

import com.api.ero_api.auxiliar.enums.EstadoCivilDoSistema;
import com.api.ero_api.auxiliar.enums.ProfissaoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoCadastroDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEmailDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEnderecoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoRedeSocialDoSistema;
import com.api.ero_api.auxiliar.enums.TipoTelefoneDoSistema;
import com.api.ero_api.auxiliar.mapper.EstadoCivilMapper;
import com.api.ero_api.auxiliar.mapper.ProfissaoMapper;
import com.api.ero_api.auxiliar.mapper.TipoCadastroMapper;
import com.api.ero_api.auxiliar.mapper.TipoEmailMapper;
import com.api.ero_api.auxiliar.mapper.TipoEnderecoMapper;
import com.api.ero_api.auxiliar.mapper.TipoRedeSocialMapper;
import com.api.ero_api.auxiliar.mapper.TipoTelefoneMapper;
import com.api.ero_api.auxiliar.repository.EstadoCivilRepository;
import com.api.ero_api.auxiliar.repository.ProfissaoRepository;
import com.api.ero_api.auxiliar.repository.TipoCadastroRepository;
import com.api.ero_api.auxiliar.repository.TipoEmailRepository;
import com.api.ero_api.auxiliar.repository.TipoEnderecoRepository;
import com.api.ero_api.auxiliar.repository.TipoRedeSocialRepository;
import com.api.ero_api.auxiliar.repository.TipoTelefoneRepository;
import com.api.ero_api.seguranca.SecurityUtils;
import com.api.ero_api.seguranca.tenant.TenantContext;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Itens do sistema dos 7 cadastros auxiliares (Cliente, Celular, Particular,
 * Residencial, Instagram, Solteiro(a), Autônomo(a)...), semeados em cada contratante.
 * Os contratantes que já existiam receberam pelas migrations 014 (os 5 tipos) e 019
 * (estado civil e profissão); os novos recebem aqui.
 */
@Service
public class ItensDoSistemaService {

    private final TipoCadastroRepository tiposCadastro;
    private final TipoTelefoneRepository tiposTelefone;
    private final TipoEmailRepository tiposEmail;
    private final TipoEnderecoRepository tiposEndereco;
    private final TipoRedeSocialRepository tiposRedeSocial;
    private final EstadoCivilRepository estadosCivis;
    private final ProfissaoRepository profissoes;

    public ItensDoSistemaService(TipoCadastroRepository tiposCadastro, TipoTelefoneRepository tiposTelefone,
                                 TipoEmailRepository tiposEmail, TipoEnderecoRepository tiposEndereco,
                                 TipoRedeSocialRepository tiposRedeSocial, EstadoCivilRepository estadosCivis,
                                 ProfissaoRepository profissoes) {
        this.tiposCadastro = tiposCadastro;
        this.tiposTelefone = tiposTelefone;
        this.tiposEmail = tiposEmail;
        this.tiposEndereco = tiposEndereco;
        this.tiposRedeSocial = tiposRedeSocial;
        this.estadosCivis = estadosCivis;
        this.profissoes = profissoes;
    }

    /**
     * Grava os itens do sistema do contratante recém-criado, na transação do
     * {@code TenantService.criar}. Só roda no fluxo de plataforma: a sessão do superadmin
     * já é ROOT (nenhum {@code comoRoot} novo), e é o ROOT que deixa gravar com o tenant
     * atribuído à mão, como o admin inicial. O código vem do enum (1..N), nunca do
     * maior + 1, que em ROOT pegaria o de todos os contratantes.
     */
    @Transactional
    public void semear(UUID tenantId) {
        if (!TenantContext.ROOT.equals(SecurityUtils.getTenantIdLogado())) {
            throw new IllegalStateException("Os itens do sistema só são semeados pela plataforma, ao criar o contratante.");
        }
        tiposCadastro.saveAll(Arrays.stream(TipoCadastroDoSistema.values())
                .map(i -> TipoCadastroMapper.doSistema(i, tenantId)).toList());
        tiposTelefone.saveAll(Arrays.stream(TipoTelefoneDoSistema.values())
                .map(i -> TipoTelefoneMapper.doSistema(i, tenantId)).toList());
        tiposEmail.saveAll(Arrays.stream(TipoEmailDoSistema.values())
                .map(i -> TipoEmailMapper.doSistema(i, tenantId)).toList());
        tiposEndereco.saveAll(Arrays.stream(TipoEnderecoDoSistema.values())
                .map(i -> TipoEnderecoMapper.doSistema(i, tenantId)).toList());
        tiposRedeSocial.saveAll(Arrays.stream(TipoRedeSocialDoSistema.values())
                .map(i -> TipoRedeSocialMapper.doSistema(i, tenantId)).toList());
        estadosCivis.saveAll(Arrays.stream(EstadoCivilDoSistema.values())
                .map(i -> EstadoCivilMapper.doSistema(i, tenantId)).toList());
        profissoes.saveAll(Arrays.stream(ProfissaoDoSistema.values())
                .map(i -> ProfissaoMapper.doSistema(i, tenantId)).toList());
    }
}
