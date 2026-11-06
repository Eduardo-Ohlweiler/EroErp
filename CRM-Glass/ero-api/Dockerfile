# Imagem de produção da API. Um container por contratante = a mesma imagem com
# variáveis de ambiente diferentes (banco, segredos, CORS).

# --- build ---
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src/ src/
RUN ./mvnw -B -q package -DskipTests && \
    java -Djarmode=tools -jar target/ero-api-*.jar extract --layers --launcher --destination target/extraido

# --- execução ---
FROM eclipse-temurin:25-jre
RUN groupadd --system ero && useradd --system --gid ero --home /app ero
WORKDIR /app
COPY --from=build /app/target/extraido/dependencies/ ./
COPY --from=build /app/target/extraido/spring-boot-loader/ ./
COPY --from=build /app/target/extraido/snapshot-dependencies/ ./
COPY --from=build /app/target/extraido/application/ ./
USER ero
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
