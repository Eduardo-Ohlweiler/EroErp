Rode o build completo do projeto EroErp para garantir que não há erros de compilação.

O diretório raiz do projeto é o working directory atual. Os subprojetos estão em `ero/` (frontend) e `ero-erp-api/` (backend).

Execute os dois builds em sequência:

**1. Frontend (TypeScript + Vite)**
```
cd ero && npm run build
```
O comando `npm run build` roda `tsc -b && vite build`. Se o TypeScript tiver erros de tipo, o build falha antes do Vite.

**2. Backend (Spring Boot / Maven)**
No Windows use:
```
cd ero-erp-api && .\mvnw.cmd compile -q
```
No Linux/Mac use:
```
cd ero-erp-api && ./mvnw compile -q
```
Detecte o sistema operacional antes de executar. Use `-q` para suprimir logs verbose e mostrar apenas erros.

**Após cada build:**
- Se passou sem erros: informe "✓ Frontend OK" / "✓ Backend OK"
- Se falhou: mostre os erros exatos, identifique os arquivos e linhas envolvidos, e pergunte se deve corrigir agora

**Ao final:** dê um resumo de duas linhas — o que passou, o que falhou (se houver).
