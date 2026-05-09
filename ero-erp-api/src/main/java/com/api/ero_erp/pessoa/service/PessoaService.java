package com.api.ero_erp.pessoa.service;

import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.cliente.service.ClienteService;
import com.api.ero_erp.config.SecurityUtils;
import com.api.ero_erp.exceptions.BadRequestException;
import com.api.ero_erp.exceptions.ConflictException;
import com.api.ero_erp.exceptions.NotFoundException;
import com.api.ero_erp.pessoa.dtos.PessoaCreateDto;
import com.api.ero_erp.pessoa.dtos.PessoaResponseDto;
import com.api.ero_erp.pessoa.dtos.PessoaSelectDto;
import com.api.ero_erp.pessoa.dtos.PessoaUpdateDto;
import com.api.ero_erp.pessoa.entity.Pessoa;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.pessoa.mapper.PessoaMapper;
import com.api.ero_erp.pessoa.repository.PessoaRepository;
import com.api.ero_erp.pessoa.util.PessoaValidator;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import com.api.ero_erp.tipocadastro.service.TipoCadastroService;
import com.api.ero_erp.usuario.entity.Usuario;
import com.api.ero_erp.usuario.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class PessoaService {

    private final PessoaRepository    pessoaRepository;
    private final ClienteService      clienteService;
    private final TipoCadastroService tipoCadastroService;
    private final UsuarioService      usuarioService;
    private final SecurityUtils       securityUtils;

    public PessoaService(
            PessoaRepository    pessoaRepository,
            ClienteService      clienteService,
            TipoCadastroService tipoCadastroService,
            UsuarioService      usuarioService,
            SecurityUtils       securityUtils
    ) {
        this.pessoaRepository    = pessoaRepository;
        this.clienteService      = clienteService;
        this.tipoCadastroService = tipoCadastroService;
        this.usuarioService      = usuarioService;
        this.securityUtils       = securityUtils;
    }

    @Transactional(readOnly = true)
    public Pessoa findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return pessoaRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Pessoa não encontrada"));
    }

    @Transactional(readOnly = true)
    public PessoaResponseDto findByIdResponse(Long id) {
        return PessoaMapper.toDto(this.findById(id));
    }

    @Transactional(readOnly = true)
    public Page<PessoaResponseDto> getAll(
            Pageable pageable,
            String     nome,
            String     cpf,
            String     rg,
            String     cnh,
            String     cnpj,
            Boolean    ativo,
            TipoPessoa tipoPessoa,
            Long       tipoCadastroId
    ) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return pessoaRepository
                .findAllWithFilters(pageable, clienteId, nome, cpf, rg, cnh, cnpj, ativo, tipoPessoa, tipoCadastroId)
                .map(PessoaMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<PessoaSelectDto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return pessoaRepository.findForSelect(clienteId, nome)
                .stream()
                .map(PessoaMapper::toSelectDto)
                .toList();
    }

    @Transactional
    public PessoaResponseDto create(PessoaCreateDto dto) {
        Cliente cliente = clienteService.findById(securityUtils.getClienteIdLogado());
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        validarCamposPorTipo(dto.tipoPessoa(), dto.cpf(), dto.rg(), dto.cnpj(),
                dto.inscricaoEstadual(), dto.inscricaoMunicipal(),
                dto.nomeFantasia(), dto.razaoSocial(),
                dto.cnh(), dto.cnhCategoria(), dto.cnhValidade());

        validarDocumentos(dto.cpf(), dto.rg(), dto.cnpj(),
                dto.inscricaoEstadual(), dto.inscricaoMunicipal(),
                dto.cnh(), cliente.getId(), null);

        Set<TipoCadastro> tiposCadastro = tipoCadastroService.findAllByIds(dto.tiposCadastroIds());

        Pessoa pessoa = new Pessoa();
        pessoa.setCliente(cliente);
        pessoa.setNome(dto.nome());
        pessoa.setTipoPessoa(dto.tipoPessoa());
        if(dto.dataNascimento() != null)
            pessoa.setDataNascimento(dto.dataNascimento());
        if(dto.cpf() != null && !dto.cpf().isBlank())
            pessoa.setCpf(removeCaracteresEstranhos(dto.cpf()));
        if(dto.rg() != null && !dto.rg().isBlank())
            pessoa.setRg(removeCaracteresEstranhos(dto.rg()));
        if (hasValue(dto.cnh()))
            pessoa.setCnh(removeCaracteresEstranhos(dto.cnh()));
        if (hasValue(dto.cnhCategoria()))
            pessoa.setCnhCategoria(dto.cnhCategoria());
        if (dto.cnhValidade() != null)
            pessoa.setCnhValidade(dto.cnhValidade());
        if(dto.cnpj() != null && !dto.cnpj().isBlank())
            pessoa.setCnpj(removeCaracteresEstranhos(dto.cnpj()));
        if(dto.inscricaoEstadual() != null && !dto.inscricaoEstadual().isBlank())
            pessoa.setInscricaoEstadual(removeCaracteresEstranhos(dto.inscricaoEstadual()));
        if(dto.inscricaoMunicipal() != null && !dto.inscricaoMunicipal().isBlank())
            pessoa.setInscricaoMunicipal(removeCaracteresEstranhos(dto.inscricaoMunicipal()));
        if(dto.nomeFantasia() != null && !dto.nomeFantasia().isBlank())
            pessoa.setNomeFantasia(dto.nomeFantasia());
        if(dto.razaoSocial() != null && !dto.razaoSocial().isBlank())
            pessoa.setRazaoSocial(dto.razaoSocial());
        pessoa.setCreatedBy(usuario);
        if (tiposCadastro != null)
            pessoa.getTiposCadastro().addAll(tiposCadastro);

        return PessoaMapper.toDto(pessoaRepository.save(pessoa));
    }

    @Transactional
    public PessoaResponseDto update(Long id, PessoaUpdateDto dto) {
        Pessoa  pessoa    = this.findById(id);
        Usuario usuario   = usuarioService.findById(securityUtils.getUsuarioIdLogado());
        Long    clienteId = pessoa.getCliente().getId();

        validarCamposPorTipo(pessoa.getTipoPessoa(), dto.cpf(), dto.rg(), dto.cnpj(),
                dto.inscricaoEstadual(), dto.inscricaoMunicipal(),
                dto.nomeFantasia(), dto.razaoSocial(),
                dto.cnh(), dto.cnhCategoria(), dto.cnhValidade());

        validarDocumentos(dto.cpf(), dto.rg(), dto.cnpj(),
                dto.inscricaoEstadual(), dto.inscricaoMunicipal(),
                dto.cnh(), clienteId, id);

        Set<TipoCadastro> tiposCadastro = tipoCadastroService.findAllByIds(dto.tiposCadastroIds());

        pessoa.setNome(dto.nome());
        pessoa.setTipoPessoa(dto.tipoPessoa());
        if(dto.dataNascimento() != null)
            pessoa.setDataNascimento(dto.dataNascimento());
        if(dto.cpf() != null && !dto.cpf().isBlank())
            pessoa.setCpf(removeCaracteresEstranhos(dto.cpf()));
        if(dto.rg() != null && !dto.rg().isBlank())
            pessoa.setRg(removeCaracteresEstranhos(dto.rg()));
        if (hasValue(dto.cnh()))
            pessoa.setCnh(removeCaracteresEstranhos(dto.cnh()));
        if (hasValue(dto.cnhCategoria()))
            pessoa.setCnhCategoria(dto.cnhCategoria());
        if (dto.cnhValidade() != null)
            pessoa.setCnhValidade(dto.cnhValidade());
        if(dto.cnpj() != null && !dto.cnpj().isBlank())
            pessoa.setCnpj(removeCaracteresEstranhos(dto.cnpj()));
        if(dto.inscricaoEstadual() != null && !dto.inscricaoEstadual().isBlank())
            pessoa.setInscricaoEstadual(removeCaracteresEstranhos(dto.inscricaoEstadual()));
        if(dto.inscricaoMunicipal() != null && !dto.inscricaoMunicipal().isBlank())
            pessoa.setInscricaoMunicipal(removeCaracteresEstranhos(dto.inscricaoMunicipal()));
        if(dto.nomeFantasia() != null && !dto.nomeFantasia().isBlank())
            pessoa.setNomeFantasia(dto.nomeFantasia());
        if(dto.razaoSocial() != null && !dto.razaoSocial().isBlank())
            pessoa.setRazaoSocial(dto.razaoSocial());
        pessoa.setUpdatedBy(usuario);

        pessoa.getTiposCadastro().clear();
        if (tiposCadastro != null)
            pessoa.getTiposCadastro().addAll(tiposCadastro);

        return PessoaMapper.toDto(pessoaRepository.save(pessoa));
    }


    @Transactional
    public PessoaResponseDto alterarAtivo(Long id, Boolean ativo) {
        Pessoa  pessoa  = this.findById(id);
        Usuario usuario = usuarioService.findById(securityUtils.getUsuarioIdLogado());

        pessoa.setAtivo(ativo);
        pessoa.setUpdatedBy(usuario);

        return PessoaMapper.toDto(pessoaRepository.save(pessoa));
    }


    private void validarCamposPorTipo(
            TipoPessoa tipoPessoa,
            String cpf, String rg, String cnpj,
            String inscricaoEstadual, String inscricaoMunicipal,
            String nomeFantasia, String razaoSocial,
            String cnh, String cnhCategoria, LocalDate cnhValidade
    ) {
        if (tipoPessoa == TipoPessoa.PESSOA_FISICA) {
            if (hasValue(cnpj))
                throw new BadRequestException("Pessoa física não pode ter CNPJ informado");
            if (hasValue(inscricaoEstadual))
                throw new BadRequestException("Pessoa física não pode ter Inscrição Estadual informada");
            if (hasValue(inscricaoMunicipal))
                throw new BadRequestException("Pessoa física não pode ter Inscrição Municipal informada");
            if (hasValue(nomeFantasia))
                throw new BadRequestException("Pessoa física não pode ter Nome Fantasia informado");
            if (hasValue(razaoSocial))
                throw new BadRequestException("Pessoa física não pode ter Razão Social informada");

        } else if (tipoPessoa == TipoPessoa.PESSOA_JURIDICA) {
            if (hasValue(cpf))
                throw new BadRequestException("Pessoa jurídica não pode ter CPF informado");
            if (hasValue(rg))
                throw new BadRequestException("Pessoa jurídica não pode ter RG informado");
            if (hasValue(cnh) || hasValue(cnhCategoria) || cnhValidade != null)
                throw new BadRequestException("Pessoa jurídica não pode ter CNH informada");
        }

        if (!hasValue(cnh) && (hasValue(cnhCategoria) || cnhValidade != null))
            throw new BadRequestException("Categoria e validade da CNH exigem o número da CNH");
    }

    private void validarDocumentos(
            String cpf, String rg, String cnpj,
            String inscricaoEstadual, String inscricaoMunicipal,
            String cnh,
            Long clienteId, Long id
    ) {
        if (hasValue(cpf)) {
            if (!PessoaValidator.validarCPF(cpf))
                throw new BadRequestException("CPF inválido");
            if (id == null
                    ? pessoaRepository.existsByCpfAndClienteId(cpf, clienteId)
                    : pessoaRepository.existsByCpfAndClienteIdAndIdNot(cpf, clienteId, id))
                throw new ConflictException("CPF já cadastrado para outro registro");
        }

        if (hasValue(rg)) {
            if (!PessoaValidator.validarRG(rg))
                throw new BadRequestException("RG inválido");
            if (id == null
                    ? pessoaRepository.existsByRgAndClienteId(rg, clienteId)
                    : pessoaRepository.existsByRgAndClienteIdAndIdNot(rg, clienteId, id))
                throw new ConflictException("RG já cadastrado para outro registro");
        }

        if (hasValue(cnpj)) {
            if (!PessoaValidator.validarCNPJ(cnpj))
                throw new BadRequestException("CNPJ inválido");
            if (id == null
                    ? pessoaRepository.existsByCnpjAndClienteId(cnpj, clienteId)
                    : pessoaRepository.existsByCnpjAndClienteIdAndIdNot(cnpj, clienteId, id))
                throw new ConflictException("CNPJ já cadastrado para outro registro");
        }

        if (hasValue(inscricaoEstadual)) {
            if (!PessoaValidator.validarInscricaoEstadual(inscricaoEstadual))
                throw new BadRequestException("Inscrição Estadual inválida");
            if (id == null
                    ? pessoaRepository.existsByInscricaoEstadualAndClienteId(inscricaoEstadual, clienteId)
                    : pessoaRepository.existsByInscricaoEstadualAndClienteIdAndIdNot(inscricaoEstadual, clienteId, id))
                throw new ConflictException("Inscrição Estadual já cadastrada para outro registro");
        }

        if (hasValue(inscricaoMunicipal)) {
            if (!PessoaValidator.validarInscricaoMunicipal(inscricaoMunicipal))
                throw new BadRequestException("Inscrição Municipal inválida");
            if (id == null
                    ? pessoaRepository.existsByInscricaoMunicipalAndClienteId(inscricaoMunicipal, clienteId)
                    : pessoaRepository.existsByInscricaoMunicipalAndClienteIdAndIdNot(inscricaoMunicipal, clienteId, id))
                throw new ConflictException("Inscrição Municipal já cadastrada para outro registro");
        }

        if (hasValue(cnh)) {
            if (!PessoaValidator.validarCNH(cnh))
                throw new BadRequestException("CNH inválida");
            if (id == null
                    ? pessoaRepository.existsByCnhAndClienteId(cnh, clienteId)
                    : pessoaRepository.existsByCnhAndClienteIdAndIdNot(cnh, clienteId, id))
                throw new ConflictException("CNH já cadastrada para outro registro");
        }
    }

    private boolean hasValue(String valor) {
        return valor != null && !valor.isBlank();
    }

    private static String removeCaracteresEstranhos(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.replaceAll("\\D", "");
    }
}