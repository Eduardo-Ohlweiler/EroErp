# Contratantes

Contratante = a empresa cliente (tenant). Só o superadmin gerencia; é a plataforma, não o contratante (por isso não há grupo de liberação).

## Regras vigentes

- **Limite de usuários ativos** definido pelo superadmin na contratação (obrigatório, 1 a 10000, editável). Limite 5 = administrador inicial + 4. Só ativos contam; o superadmin nunca conta.
- Criar e reativar exigem vaga (422 "... Fale com o suporte para ampliar."). Inativar libera a vaga. Baixar o limite abaixo do uso é aceito: ninguém é desligado, só criar e reativar travam.
- **Aparência é do contratante** e só o superadmin configura (fundo, destaque, vidro, animações, desempenho). Vale para todos os usuários dele.
- **Exceção: claro ou escuro é de cada usuário.** A escolha fica salva no usuário; quem nunca escolheu segue o tema padrão do contratante. Precedência: sistema, contratante, usuário, prévia da Aparência. Voltar a "seguir o contratante" fica na Minha conta ([[usuarios-e-acesso]]).
- **Modo leve** (desempenho): o superadmin pode ligar "Otimizar desempenho em computadores mais fracos"; por padrão todos veem o visual completo.
- **Acessar contratante:** o superadmin entra num contratante pelo chip da barra (seletor com busca) ou pela ação "Acessar contratante" na grade (só nos ativos). Dentro dele aparece a faixa fixa "Você está dentro de X como suporte da plataforma" com "Sair do contratante" (não imprime). Entrar e sair levam ao Início. Fica registrado na trilha ([[logs-e-auditoria]]).
- Na visão de plataforma o superadmin só lê dados de contratante; escrever exige acessar o contratante antes. Lista e ficha de contratantes só respondem na visão de plataforma.
- Contratante inativado cai na hora.

## Decisões do dono

- 06/11/2026 (P2 e P3): aparência fixa por contratante, só o superadmin muda.
- 11/11/2026: limite de usuários por contratante definido na negociação.
- 14/11/2026: tema claro/escuro por usuário (revisa a P2); acessar contratante nos dois lugares (Fatia 3).

## Em aberto

- Hospedagem: banco compartilhado ou container por contratante (provável o segundo); o modelo atual serve aos dois.
- Fotos de cena exclusiva ficam em URL pública previsível: resolver antes da 1ª cena exclusiva (`PLANO-FATIA-2.md` §5).

## Doc técnico

`docs/03-multitenant.md` (Aparência, Tema do usuário, Limite de usuários, Superadmin), `docs/04-permissoes.md` (telas sem grupo), `docs/06-fundos-de-cena.md`.
