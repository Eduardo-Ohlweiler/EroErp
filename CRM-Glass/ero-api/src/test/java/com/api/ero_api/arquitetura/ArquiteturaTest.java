package com.api.ero_api.arquitetura;

import static com.tngtech.archunit.core.domain.JavaCall.Predicates.target;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo;
import static com.tngtech.archunit.core.domain.properties.HasName.Predicates.nameMatching;
import static com.tngtech.archunit.core.domain.properties.HasOwner.Predicates.With.owner;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.api.ero_api.compartilhado.entity.BaseEntity;
import com.api.ero_api.compartilhado.entity.SqlNativoRevisado;
import com.api.ero_api.compartilhado.entity.TenantEntity;
import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.GeneralCodingRules;
import jakarta.annotation.security.PermitAll;
import jakarta.persistence.Entity;
import com.api.ero_api.seguranca.tenant.TenantContext;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RestController;

/**
 * A estrutura definida em docs/01-arquitetura-backend.md, verificada a cada
 * {@code mvnw verify}. Se uma regra quebrar, corrija o código — não a regra.
 * Mudar regra é decisão do dono do produto.
 */
@AnalyzeClasses(packages = "com.api.ero_api", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquiteturaTest {

    private static final String RAIZ = "com.api.ero_api";

    /** Pacotes de infraestrutura (não são módulos de negócio). */
    private static final Set<String> INFRA = Set.of("compartilhado", "seguranca");

    /** Subpastas permitidas dentro de um módulo. */
    private static final Pattern PACOTE_DE_MODULO = Pattern.compile(
            Pattern.quote(RAIZ) + "\\.[a-z0-9]+\\.(entity|enums|repository|dtos|mapper|service|controller|util)");

    /** Entidades que de propósito NÃO pertencem a um tenant (justificativa no Javadoc de cada uma). */
    private static final Set<String> ENTIDADES_SEM_TENANT = Set.of(
            "com.api.ero_api.tenant.entity.Tenant",
            "com.api.ero_api.auditoria.entity.EventoSeguranca",
            "com.api.ero_api.sessao.entity.SessaoUsuario",
            "com.api.ero_api.sessao.entity.RefreshToken");

    // ------------------------------------------------------------ estrutura

    @ArchTest
    static final ArchRule modulosSoTemAsPastasDoPadrao = classes()
            .that().resideInAPackage(RAIZ + "..")
            .should(new ArchCondition<>("ficar numa das pastas do padrão (entity, enums, repository, dtos, mapper, service, controller, util)") {
                @Override
                public void check(JavaClass c, ConditionEvents events) {
                    String pacote = c.getPackageName();
                    if (pacote.equals(RAIZ) || INFRA.contains(modulo(pacote))) {
                        return;
                    }
                    if (!PACOTE_DE_MODULO.matcher(pacote).matches()) {
                        events.add(SimpleConditionEvent.violated(c, c.getName() + " está em " + pacote));
                    }
                }
            });

    @ArchTest
    static final ArchRule nomesPorPasta = classes()
            .that().resideInAPackage("..service..").and().areTopLevelClasses()
            .and().resideOutsideOfPackages(RAIZ + ".compartilhado..", RAIZ + ".seguranca..")
            .should().haveSimpleNameEndingWith("Service")
            .andShould().beAnnotatedWith(org.springframework.stereotype.Service.class);

    @ArchTest
    static final ArchRule controllersComNomeCerto = classes()
            .that().resideInAPackage("..controller..").and().areTopLevelClasses()
            .should().haveSimpleNameEndingWith("Controller")
            .andShould().beAnnotatedWith(RestController.class);

    @ArchTest
    static final ArchRule repositoriesComNomeCerto = classes()
            .that().resideInAPackage("..repository..")
            .should().haveSimpleNameEndingWith("Repository")
            .andShould().beInterfaces();

    @ArchTest
    static final ArchRule dtosSaoRecords = classes()
            .that().resideInAPackage("..dtos..")
            .should().beAssignableTo(Record.class)
            .andShould().haveSimpleNameEndingWith("Dto");

    @ArchTest
    static final ArchRule mappersSaoEstaticos = classes()
            .that().resideInAPackage("..mapper..")
            .should().haveSimpleNameEndingWith("Mapper")
            .andShould().haveModifier(JavaModifier.FINAL)
            .andShould().notBeAnnotatedWith(Component.class);

    @ArchTest
    static final ArchRule metodosDeMapperSaoStatic = methods()
            .that().areDeclaredInClassesThat().resideInAPackage("..mapper..")
            .and().arePublic()
            .should().beStatic();

    // ------------------------------------------------------------ camadas

    @ArchTest
    static final ArchRule controllerNaoVeEntidadeNemRepository = noClasses()
            .that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAnyPackage("..repository..", "..entity..");

    @ArchTest
    static final ArchRule controllerSoChamaServiceDoProprioModulo = classes()
            .that().resideInAPackage("..controller..")
            .should(new ArchCondition<>("chamar só o service do próprio módulo") {
                @Override
                public void check(JavaClass controller, ConditionEvents events) {
                    String meuModulo = modulo(controller.getPackageName());
                    for (Dependency d : controller.getDirectDependenciesFromSelf()) {
                        JavaClass alvo = d.getTargetClass();
                        if (alvo.getPackageName().endsWith(".service") && !modulo(alvo.getPackageName()).equals(meuModulo)) {
                            events.add(SimpleConditionEvent.violated(d,
                                    controller.getSimpleName() + " usa " + alvo.getSimpleName() + " de outro módulo"));
                        }
                    }
                }
            });

    @ArchTest
    static final ArchRule ninguemDependeDeController = noClasses()
            .that().resideOutsideOfPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("..controller..");

    @ArchTest
    static final ArchRule repositorySoNoServiceDoProprioModulo = classes()
            .that().resideInAPackage("..repository..")
            .should(new ArchCondition<>("ser usado só pelo service do próprio módulo") {
                @Override
                public void check(JavaClass repo, ConditionEvents events) {
                    for (Dependency d : repo.getDirectDependenciesToSelf()) {
                        JavaClass origem = d.getOriginClass();
                        String pacote = origem.getPackageName();
                        boolean mesmoModulo = modulo(pacote).equals(modulo(repo.getPackageName()));
                        boolean ehService = pacote.endsWith(".service");
                        if (!mesmoModulo || !ehService) {
                            events.add(SimpleConditionEvent.violated(d, origem.getName() + " usa " + repo.getSimpleName()));
                        }
                    }
                }
            });

    @ArchTest
    static final ArchRule consultasDoRepositoryTemJpqlEscrito = methods()
            .that().areDeclaredInClassesThat().resideInAPackage("..repository..")
            .should().beAnnotatedWith(Query.class)
            .because("consulta derivada do nome (findByX) esconde o SQL; escreva o JPQL com nome em português");

    @ArchTest
    static final ArchRule contextoRootSoEmAuthSegurancaEPlataforma = noClasses()
            .that().resideOutsideOfPackages(RAIZ + ".auth..", RAIZ + ".seguranca..", RAIZ + ".compartilhado.config..")
            .should().callMethod(TenantContext.class, "comoRoot", Supplier.class)
            .orShould().callMethod(TenantContext.class, "comoTenant", UUID.class, Supplier.class)
            .because("ROOT enxerga todos os tenants (docs/03); uso novo precisa de revisão do agente seguranca");

    @ArchTest
    static final ArchRule semMetodosGenericosDeRepository = noClasses()
            .should().callMethodWhere(target(nameMatching(
                            "findById|findAll|findAllById|getReferenceById|getById|getOne|existsById|deleteById|deleteAllById|count"))
                    .and(target(owner(assignableTo(Repository.class)))))
            .because("toda consulta tem nome e JPQL explícitos no repository (ex.: buscarPorId)");

    // ------------------------------------------------------------ segurança

    @ArchTest
    static final ArchRule todoEndpointDeclaraQuemPodeChamar = methods()
            .that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
            .and().arePublic()
            .should().beAnnotatedWith(PreAuthorize.class)
            .orShould().beAnnotatedWith(PermitAll.class)
            .because("rota sem @PreAuthorize/@PermitAll é falha de controle de acesso (OWASP A01)");

    @ArchTest
    static final ArchRule entidadesEstendemBase = classes()
            .that().areAnnotatedWith(Entity.class)
            .should().beAssignableTo(BaseEntity.class)
            .andShould().resideInAPackage("..entity..");

    @ArchTest
    static final ArchRule entidadesDeNegocioTemTenant = classes()
            .that().areAnnotatedWith(Entity.class)
            .should(new ArchCondition<>("estender TenantEntity (ou estar na lista justificada de exceções)") {
                @Override
                public void check(JavaClass c, ConditionEvents events) {
                    if (!c.isAssignableTo(TenantEntity.class) && !ENTIDADES_SEM_TENANT.contains(c.getName())) {
                        events.add(SimpleConditionEvent.violated(c, c.getName() + " não estende TenantEntity"));
                    }
                }
            });

    @ArchTest
    static final ArchRule sqlNativoSoEmClasseRevisada = methods()
            .that().areAnnotatedWith(Query.class)
            .should(new ArchCondition<>("ser SQL nativo só em repository anotado com @SqlNativoRevisado") {
                @Override
                public void check(JavaMethod m, ConditionEvents events) {
                    boolean nativa = m.getAnnotationOfType(Query.class).nativeQuery();
                    if (nativa && !m.getOwner().isAnnotatedWith(SqlNativoRevisado.class)) {
                        events.add(SimpleConditionEvent.violated(m, m.getFullName() + " usa SQL nativo sem revisão"));
                    }
                }
            });

    @ArchTest
    static final ArchRule semSystemOut = GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS;

    @ArchTest
    static final ArchRule semPrintStackTrace = noClasses()
            .should().callMethod(Throwable.class, "printStackTrace");

    @ArchTest
    static final ArchRule semInjecaoEmCampo = GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

    private static String modulo(String pacote) {
        if (!pacote.startsWith(RAIZ + ".")) {
            return "";
        }
        String resto = pacote.substring(RAIZ.length() + 1);
        int ponto = resto.indexOf('.');
        return ponto < 0 ? resto : resto.substring(0, ponto);
    }
}
