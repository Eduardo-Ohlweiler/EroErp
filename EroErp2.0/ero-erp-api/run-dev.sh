#!/usr/bin/env bash
# Sobe a API em desenvolvimento carregando as variáveis do .env.
#
#   ./run-dev.sh              sobe a aplicação
#   ./run-dev.sh test         roda os testes
#   ./run-dev.sh package      gera o jar
#
# Pré-requisitos: JDK 21 e PostgreSQL local com o banco já criado.
#   createdb -U postgres -h localhost ero_erp
#   createdb -U postgres -h localhost ero_erp_test

set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  echo "AVISO: .env não encontrado. Copie .env.example para .env." >&2
fi

# O Maven usa JAVA_HOME, não o `java` do PATH. Em máquina com mais de um JDK
# instalado é comum o JAVA_HOME apontar para o 17 e o build falhar com
# "release version 21 not supported". Localiza o 21 e usa.
if [[ -z "${JAVA_HOME:-}" || ! -x "${JAVA_HOME}/bin/javac" ]] \
   || ! "${JAVA_HOME}/bin/javac" -version 2>&1 | grep -q ' 21'; then
  # Linux e, no Windows (Git Bash), as pastas de instalação usuais.
  for candidato in /usr/lib/jvm/java-21-openjdk-amd64 \
                   /usr/lib/jvm/java-1.21.0-openjdk-amd64 \
                   /usr/lib/jvm/openjdk-21 \
                   /usr/lib/jvm/temurin-21-jdk-amd64 \
                   "/c/Program Files/Java/jdk-21"* \
                   "/c/Program Files/Eclipse Adoptium/jdk-21"*; do
    if [[ -x "$candidato/bin/javac" ]]; then
      export JAVA_HOME="$candidato"
      break
    fi
  done
fi

if [[ -z "${JAVA_HOME:-}" ]] || ! "${JAVA_HOME}/bin/javac" -version 2>&1 | grep -q ' 21'; then
  echo "ERRO: JDK 21 não encontrado. Instale-o ou exporte JAVA_HOME apontando para ele." >&2
  exit 1
fi

for var in DB_URL DB_USER DB_PASSWORD JWT_SECRET SUPERADMIN_EMAIL SUPERADMIN_PASSWORD SUPERADMIN_NAME; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERRO: variável obrigatória não definida: $var" >&2
    exit 1
  fi
done

if (( ${#JWT_SECRET} < 32 )); then
  echo "ERRO: JWT_SECRET precisa de no mínimo 32 caracteres (tem ${#JWT_SECRET})." >&2
  exit 1
fi

# Windows: o JDK 21 abre um socket local (AF_UNIX) na pasta temporária para o
# Selector do NIO, e em algumas máquinas a temp do usuário recusa esse tipo de
# socket — o Tomcat morre com "Unable to establish loopback connection", e os
# testes, que usam MockMvc sem Tomcat, passam sem perceber. Uma pasta dentro do
# projeto resolve.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    mkdir -p .tmp
    export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:+$JAVA_TOOL_OPTIONS }-Djdk.net.unixdomain.tmpdir=$(cygpath -w "$PWD/.tmp")"
    ;;
esac

# Maven: o wrapper do projeto, o do PATH ou, por fim, uma distribuição que o
# wrapper de outro projeto já baixou para ~/.m2.
MVN="./mvnw"
if [[ ! -x "$MVN" ]]; then
  if command -v mvn >/dev/null 2>&1; then
    MVN="mvn"
  else
    MVN="$(ls -d "$HOME"/.m2/wrapper/dists/apache-maven-3.9.*/*/apache-maven-3.9.*/bin/mvn 2>/dev/null | tail -1)"
    [[ -n "$MVN" ]] || { echo "ERRO: Maven não encontrado." >&2; exit 1; }
  fi
fi

case "${1:-run}" in
  run)     exec "$MVN" spring-boot:run ;;
  test)    exec "$MVN" test ;;
  package) exec "$MVN" clean package ;;
  *)       exec "$MVN" "$@" ;;
esac
