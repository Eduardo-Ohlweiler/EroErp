package com.api.ero_api.compartilhado.entity;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca um repository que tem SQL nativo ({@code nativeQuery = true}).
 *
 * <p>SQL nativo NÃO passa pelo filtro automático de tenant. Quem usa esta
 * anotação declara que cada consulta nativa da classe foi revisada e que:
 * filtra {@code tenant_id} à mão OU é intencionalmente global (ex.: e-mail único
 * no sistema todo). Explique o motivo em {@link #value()}.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface SqlNativoRevisado {

    /** Por que esta classe precisa de SQL nativo. */
    String value();
}
