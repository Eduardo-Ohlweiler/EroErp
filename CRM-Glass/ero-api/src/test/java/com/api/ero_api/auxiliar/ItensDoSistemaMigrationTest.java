package com.api.ero_api.auxiliar;

import static org.assertj.core.api.Assertions.assertThat;

import com.api.ero_api.auxiliar.enums.EstadoCivilDoSistema;
import com.api.ero_api.auxiliar.enums.ProfissaoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoCadastroDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEmailDoSistema;
import com.api.ero_api.auxiliar.enums.TipoEnderecoDoSistema;
import com.api.ero_api.auxiliar.enums.TipoRedeSocialDoSistema;
import com.api.ero_api.auxiliar.enums.TipoTelefoneDoSistema;
import com.api.ero_api.compartilhado.util.TextoBusca;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

/**
 * As sementes das migrations 014 e 019 (contratantes que já existiam) e os enums
 * (contratante novo) têm de ser iguais: mesma chave, mesmo nome, mesmo código e o
 * {@code nome_busca} que o Java calcularia. No banco de teste a semente não grava nada
 * (só existe a Plataforma quando ela roda), por isso a conferência é no próprio arquivo.
 */
class ItensDoSistemaMigrationTest {

    private static final Pattern LINHA = Pattern.compile("\\((\\d+), '([^']*)', '([^']*)', '([^']*)'\\)");

    @Test
    void sementeDa014IgualAosEnums() throws IOException {
        String xml = lerMigration("014-create-tipos-auxiliares");
        conferir(xml, "014-create-tipos-auxiliares-tipo-cadastro", TipoCadastroDoSistema.values(), TipoCadastroDoSistema::rotulo);
        conferir(xml, "014-create-tipos-auxiliares-tipo-telefone", TipoTelefoneDoSistema.values(), TipoTelefoneDoSistema::rotulo);
        conferir(xml, "014-create-tipos-auxiliares-tipo-email", TipoEmailDoSistema.values(), TipoEmailDoSistema::rotulo);
        conferir(xml, "014-create-tipos-auxiliares-tipo-endereco", TipoEnderecoDoSistema.values(), TipoEnderecoDoSistema::rotulo);
        conferir(xml, "014-create-tipos-auxiliares-tipo-rede-social", TipoRedeSocialDoSistema.values(),
                TipoRedeSocialDoSistema::rotulo);
    }

    @Test
    void sementeDa019IgualAosEnums() throws IOException {
        String xml = lerMigration("019-create-estado-civil-profissao");
        conferir(xml, "019-create-estado-civil-profissao-estado-civil", EstadoCivilDoSistema.values(),
                EstadoCivilDoSistema::rotulo);
        conferir(xml, "019-create-estado-civil-profissao-profissao", ProfissaoDoSistema.values(), ProfissaoDoSistema::rotulo);
    }

    /** {@code prefixo}: id do changeSet de criação; a semente é o {@code <prefixo>-semente}. */
    private static <E extends Enum<E>> void conferir(String xml, String prefixo, E[] itens, Function<E, String> rotulo) {
        String id = prefixo + "-semente";
        int inicio = xml.indexOf("\"" + id + "\"");
        assertThat(inicio).as("changeSet %s", id).isPositive();
        String bloco = xml.substring(inicio, xml.indexOf("</changeSet>", inicio));
        List<String> naMigration = new ArrayList<>();
        Matcher m = LINHA.matcher(bloco);
        while (m.find()) {
            assertThat(m.group(3)).as("nome_busca de %s", m.group(2)).isEqualTo(TextoBusca.normalizar(m.group(2)));
            naMigration.add(m.group(1) + "|" + m.group(2) + "|" + m.group(4));
        }
        List<String> noEnum = Arrays.stream(itens)
                .map(e -> (e.ordinal() + 1) + "|" + rotulo.apply(e) + "|" + e.name())
                .toList();
        assertThat(naMigration).as(id).containsExactlyElementsOf(noEnum);
    }

    private static String lerMigration(String nome) throws IOException {
        try (InputStream in = ItensDoSistemaMigrationTest.class.getResourceAsStream(
                "/db/changelog/changes/" + nome + ".xml")) {
            assertThat(in).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
