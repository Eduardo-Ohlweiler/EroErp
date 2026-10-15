package com.api.ero_erp.contato.mapper;

import com.api.ero_erp.contato.dtos.EmailResponseDto;
import com.api.ero_erp.contato.dtos.EnderecoResponseDto;
import com.api.ero_erp.contato.dtos.RedeSocialResponseDto;
import com.api.ero_erp.contato.dtos.TelefoneResponseDto;
import com.api.ero_erp.contato.entity.Email;
import com.api.ero_erp.contato.entity.Endereco;
import com.api.ero_erp.contato.entity.RedeSocial;
import com.api.ero_erp.contato.entity.Telefone;

import java.util.Comparator;
import java.util.List;

public final class ContatoMapper {

    private ContatoMapper() {}

    /** Principal primeiro: é o número que a equipe procura na tela. */
    public static List<TelefoneResponseDto> toTelefoneList(List<Telefone> telefones) {
        if (telefones == null) return List.of();
        return telefones.stream()
                .sorted(Comparator.comparing(Telefone::getPrincipal).reversed())
                .map(t -> new TelefoneResponseDto(
                        t.getId(),
                        t.getTipoTelefone().getId(),
                        t.getTipoTelefone().getNome(),
                        t.getCodigoPais(),
                        t.getNumero(),
                        t.getObservacao(),
                        t.getPrincipal()))
                .toList();
    }

    public static List<EmailResponseDto> toEmailList(List<Email> emails) {
        if (emails == null) return List.of();
        return emails.stream()
                .sorted(Comparator.comparing(Email::getPrincipal).reversed())
                .map(e -> new EmailResponseDto(
                        e.getId(),
                        e.getTipoEmail().getId(),
                        e.getTipoEmail().getNome(),
                        e.getEmail(),
                        e.getObservacao(),
                        e.getPrincipal()))
                .toList();
    }

    /** Principal primeiro, como nas demais listas. */
    public static List<EnderecoResponseDto> toEnderecoList(List<Endereco> enderecos) {
        if (enderecos == null) return List.of();
        return enderecos.stream()
                .sorted(Comparator.comparing(Endereco::getPrincipal).reversed())
                .map(e -> new EnderecoResponseDto(
                        e.getId(),
                        e.getTipoEndereco().getId(),
                        e.getTipoEndereco().getNome(),
                        e.getCidade().getId(),
                        e.getCidade().getNome(),
                        e.getCidade().getEstado().getSigla(),
                        e.getCidade().getEstado().getNome(),
                        e.getCep(),
                        e.getRua(),
                        e.getNumero(),
                        e.getBairro(),
                        e.getComplemento(),
                        e.getPrincipal()))
                .toList();
    }

    public static List<RedeSocialResponseDto> toRedeSocialList(List<RedeSocial> redes) {
        if (redes == null) return List.of();
        return redes.stream()
                .map(r -> new RedeSocialResponseDto(
                        r.getId(),
                        r.getTipoRedeSocial().getId(),
                        r.getTipoRedeSocial().getNome(),
                        r.getUsuario(),
                        r.getUrl(),
                        r.getObservacao()))
                .toList();
    }
}
