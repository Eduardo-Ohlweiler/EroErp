package com.api.ero_api.compartilhado.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Texto de busca sem acento e sem diferença de maiúsculas: é o que vai nas colunas
 * {@code nome_busca} (pessoa, cidade, tipos auxiliares) e no termo que o usuário digita.
 * Assim "São Paulo", "SAO PAULO" e "sao  paulo" se encontram, e "Celular" e "celular"
 * contam como o mesmo nome.
 *
 * <p>Feito no Java, e não com {@code unaccent} no banco, para a regra ser uma só e não
 * depender de extensão do PostgreSQL. A semente de cidades da migration 013 faz o mesmo
 * com {@code translate(lower(nome), ...)}; os nomes do IBGE só usam acentos que ela cobre.
 */
public final class TextoBusca {

    private static final Pattern MARCAS = Pattern.compile("\\p{M}+");
    private static final Pattern ESPACOS = Pattern.compile("\\s+");

    private TextoBusca() {
    }

    /** {@code null} ou só espaços → {@code null}; senão sem acento, minúsculo, espaços colapsados e sem sobra nas pontas. */
    public static String normalizar(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        String semAcento = MARCAS.matcher(Normalizer.normalize(texto, Normalizer.Form.NFD)).replaceAll("");
        return ESPACOS.matcher(semAcento.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }
}
