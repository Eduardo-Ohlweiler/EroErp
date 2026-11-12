import { Building2, MailCheck, Smartphone, Sparkles } from 'lucide-react';
import { coreografias } from '../../../motion/tokens';
import { Bloco } from '../../../motion/coreografia';
import { ParticleSphere } from '../../../motion/cena/ParticleSphere';

const DESTAQUES = [
  { icone: Building2, texto: 'Dados separados por empresa' },
  { icone: MailCheck, texto: 'Código de acesso por e-mail' },
  { icone: Smartphone, texto: 'Funciona no celular' },
];

/** Lado esquerdo do login: esfera de partículas, marca, título e destaques (coreografia `login`). */
export function VitrineLogin() {
  const v = coreografias.login.variantes;
  // Celular: altura contida (o formulário não cai para baixo da dobra); deitado, o título fica só para o leitor de tela.
  return (
    <div className="relative h-[30vh] min-h-[200px] max-h-[320px] sm:h-[40vh] sm:max-h-none lg:h-screen overflow-hidden">
      <Bloco className="absolute inset-0" variants={v.esfera} aria-hidden>
        <ParticleSphere />
      </Bloco>
      <Bloco orquestra variants={v.vitrine} className="absolute inset-x-0 bottom-6 lg:bottom-16 px-6 lg:px-16 pointer-events-none">
        <Bloco className="flex items-center gap-2.5 mb-5">
          <span className="size-9 rounded-xl accent-gradient accent-glow grid place-items-center">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">CRM Glass</span>
        </Bloco>
        <Bloco as="h1" variants={v.titulo} className="text-2xl sm:text-3xl lg:text-[46px] [@media(max-height:500px)]:sr-only font-semibold tracking-tight leading-[1.08] max-w-xl text-gradient-accent">
          Seu relacionamento com clientes, do primeiro contato ao fechamento.
        </Bloco>
        {/* Chips de vidro: o grupo só orquestra; cada chip anima a opacidade nele mesmo (backdrop-filter intacto). */}
        <Bloco orquestra variants={v.chips} className="mt-6 hidden sm:flex flex-wrap gap-2">
          {DESTAQUES.map(({ icone: I, texto }) => (
            <Bloco as="span" key={texto} className="glass-subtle h-9 px-3.5 rounded-full inline-flex items-center gap-2 text-xs font-medium">
              <I className="size-3.5 text-accent-text" aria-hidden />
              {texto}
            </Bloco>
          ))}
        </Bloco>
      </Bloco>
    </div>
  );
}
