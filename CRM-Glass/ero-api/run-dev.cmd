@echo off
rem Sobe a API em modo desenvolvimento (Postgres pelo compose.yaml; Docker precisa estar ligado).
rem Le o JAVA_HOME configurado no Windows (Maquina ou Usuario), mesmo que este terminal
rem tenha sido aberto antes da configuracao.
setlocal
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$m=[Environment]::GetEnvironmentVariable('JAVA_HOME','Machine'); $u=[Environment]::GetEnvironmentVariable('JAVA_HOME','User'); if ($u) { $u } else { $m }"`) do set "JAVA_HOME=%%i"
if not defined JAVA_HOME (
  echo JAVA_HOME nao configurado. Instale o JDK 25 e configure a variavel.
  exit /b 1
)
cd /d "%~dp0"
call "%~dp0mvnw.cmd" -q spring-boot:run -Dspring-boot.run.profiles=dev %*
