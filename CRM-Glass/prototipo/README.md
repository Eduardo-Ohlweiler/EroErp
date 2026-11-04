# Vitrum CRM — protótipo visual

Protótipo **só de front-end, com dados fictícios**, para validar o visual glass e as animações.
Não há backend, banco nem login de verdade: tudo vive em memória e some ao recarregar a página
(menos as preferências de Aparência, salvas no navegador).

"Vitrum" (vidro em latim) é um nome provisório.

## Como rodar

Precisa de Node 20 ou mais novo.

```bash
cd prototipo
npm install
npm run dev
```

Abra http://localhost:5180. Na primeira visita da aba aparece o login; qualquer clique em **Entrar** abre o sistema.

## O que olhar

| Tela | O que mostra |
|---|---|
| Login | Esfera de partículas que segue o mouse, cartão de vidro, transição de saída com desfoque |
| Dashboard | KPIs com contagem animada, gráfico de linha que se desenha, barras em pílula, medidor, rosca, ranking |
| Funil de vendas | Kanban com arrastar e soltar entre etapas, cartão de detalhe em modal, botão "Novo negócio" com validação |
| Agenda | Visões dia/semana/mês, linha do "agora", filtros por tipo, gaveta lateral com detalhes |
| Clientes / Filiais / Produtos | O mesmo componente de cadastro configurado três vezes (produtos tem grade e lista) |
| Ficha do cliente | Transição em profundidade (desliza para o lado), abas animadas |
| Design system | Níveis de vidro, cores, tipografia, botões, campos, etiquetas, toasts, movimento |
| Aparência | Troque tema, cor de destaque, fundo, intensidade do vidro e animações ao vivo |

Atalhos: **Ctrl + K** abre a busca global; o botão de sol/lua troca o tema com revelação circular.

## Estrutura

```
src/
  styles/tokens.css        tokens (cores, vidro, temas, destaques) — fonte única de estilo
  styles/index.css         classes de vidro, fundo vivo, utilidades
  motion/                  tokens de movimento, contagem animada
  theme/settings.tsx       tema, destaque, fundo, movimento (salvo no navegador)
  components/ui/           cartão de vidro, botão, campos, etiquetas, modal, gaveta, toast
  components/charts/       gráficos SVG animados (linha, barras, rosca, medidor, minilinha)
  components/layout/       menu lateral, barra superior, busca global, fundo vivo
  pages/                   telas; cadastros.tsx configura clientes, filiais e produtos
  data/                    dados fictícios
```

Stack: React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + Motion (Framer Motion) + lucide-react + React Router.
