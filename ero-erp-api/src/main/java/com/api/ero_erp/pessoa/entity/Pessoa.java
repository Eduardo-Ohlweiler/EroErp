package com.api.ero_erp.pessoa.entity;

import com.api.ero_erp.baseentity.BaseEntity;
import com.api.ero_erp.cliente.entity.Cliente;
import com.api.ero_erp.email.entity.Email;
import com.api.ero_erp.endereco.entity.Endereco;
import com.api.ero_erp.pessoa.enums.TipoPessoa;
import com.api.ero_erp.pessoavinculo.entity.PessoaVinculo;
import com.api.ero_erp.redesocial.entity.RedeSocial;
import com.api.ero_erp.telefone.entity.Telefone;
import com.api.ero_erp.tipocadastro.entity.TipoCadastro;
import com.api.ero_erp.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "pessoa")
@Getter
@Setter
@NoArgsConstructor
public class Pessoa extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", nullable = false)
    private TipoPessoa tipoPessoa;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(name = "cpf", length = 11)
    private String cpf;

    @Column(name = "rg", length = 20)
    private String rg;

    @Column(name = "cnh", length = 11)
    private String cnh;

    @Column(name = "cnh_categoria", length = 5)
    private String cnhCategoria;

    @Column(name = "cnh_validade")
    private LocalDate cnhValidade;

    @Column(name = "cnpj", length = 14)
    private String cnpj;

    @Column(name = "inscricao_estadual", length = 50)
    private String inscricaoEstadual;

    @Column(name = "inscricao_municipal", length = 50)
    private String inscricaoMunicipal;

    @Column(name = "nome_fantasia", length = 255)
    private String nomeFantasia;

    @Column(name = "razao_social", length = 255)
    private String razaoSocial;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    @ManyToMany
    @JoinTable(
            name = "pessoa_tipo_cadastro",
            joinColumns = @JoinColumn(name = "pessoa_id"),
            inverseJoinColumns = @JoinColumn(name = "tipo_cadastro_id")
    )
    private Set<TipoCadastro> tiposCadastro = new HashSet<>();

    @OneToMany(mappedBy = "pessoa", fetch = FetchType.LAZY)
    private List<Email> emails = new ArrayList<>();

    @OneToMany(mappedBy = "pessoa", fetch = FetchType.LAZY)
    private List<Telefone> telefones = new ArrayList<>();

    @OneToMany(mappedBy = "pessoa", fetch = FetchType.LAZY)
    private List<RedeSocial> redesSociais = new ArrayList<>();

    @OneToMany(mappedBy = "pessoa", fetch = FetchType.LAZY)
    private List<Endereco> enderecos = new ArrayList<>();

    @OneToMany(mappedBy = "pessoaOrigem", fetch = FetchType.LAZY)
    private List<PessoaVinculo> vinculosComoOrigem = new ArrayList<>();

    @OneToMany(mappedBy = "pessoaDestino", fetch = FetchType.LAZY)
    private List<PessoaVinculo> vinculosComoDestino = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null) this.ativo = true;
    }
}