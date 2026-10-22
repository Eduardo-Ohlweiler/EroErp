---
name: build-check
description: Build completo do EroErp 2.0 — front (tsc, vite, oxlint) e back (clean compile, e a suíte se pedida) — para saber rápido se o projeto está são.
argument-hint: "[test — roda também a suíte do backend]"
disable-model-invocation: true
---

# /build-check

Da raiz do `EroErp2.0/`, em sequência:

1. **Front:** `cd ero && npm run build && npm run lint`
2. **Back:** `cd ero-erp-api && ./run-dev.sh clean compile`
   — sempre `clean`: a compilação incremental do Maven já respondeu BUILD
   SUCCESS com o projeto quebrado (CLAUDE.md, "Backend e testes").
3. Se o argumento for `test` (**$ARGUMENTS**): `cd ero-erp-api && ./run-dev.sh test`.

Ao fim, uma linha por etapa — ✅ ou ❌ — e, para cada ❌, os erros exatos com
arquivo e linha. Pergunte se deve corrigir; não corrija sem o Eduardo pedir.
