Tecnologias Utilizadas

================ Backend ===============
- Java 21 & Spring Boot 3.5
- Spring Security & JWT: Autenticação e autorização segura.
- Spring Data JPA: Persistência de dados.
- PostgreSQL: Banco de dados relacional.
- Liquibase: Gerenciamento de versionamento do banco de dados.
- JasperReports: Geração de relatórios em PDF.
- Apache POI: Manipulação de planilhas Excel.
- Swagger (OpenAPI): Documentação interativa da API.
- Lombok: Redução de código boilerplate.

Como Executar o Backend
- Pré-requisitos:
  - JDK 21
  - Maven 3.x
  - PostgreSQL rodando localmente

- Configuração do Banco de Dados
  - Crie um banco de dados no seu PostgreSQL chamado erodb.

- Variáveis de Ambiente
  - Para rodar o projeto, você precisa configurar as seguintes variáveis de ambiente no seu sistema ou na sua IDE:
      DB_URL=jdbc:postgresql://localhost:5432/erodb
      DB_USER=postgres
      DB_PASSWORD=admin
      JWT_SECRET=minhaChaveSecretaSuperSegura12345678901234567890

- Rodando a aplicaçãoa a API estará disponível em http://localhost:8080.
- Documentação da API:
  - Após iniciar o servidor, você pode visualizar e testar os endpoints através do Swagger em: http://localhost:8080/swagger-ui.html


================ Frontend ===============
- Pré-requisitos:
    - Node.js (LTS) e NPM/Yarn.

1. Instalação:
   - Navegue até a pasta do frontend, abra o terminal bash e execute:
     npm install

2. Execução:
  - Inicie o servidor de desenvolvimento:
     `npm run dev`
     
  - O frontend estará disponível em: http://localhost:5173
