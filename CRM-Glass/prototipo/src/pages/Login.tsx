import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, Eye, EyeOff, Kanban, Lock, Mail, Sparkles, Users } from 'lucide-react';
import { ParticleSphere } from '../components/ParticleSphere';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Bits';
import { ease, item, staggerGroup } from '../motion/tokens';

export default function Login() {
  const nav = useNavigate();
  const [ver, setVer] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function entrar(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      sessionStorage.setItem('vitrum:entrou', '1');
    } catch {
      /* ignora */
    }
    setTimeout(() => nav('/'), 750);
  }

  return (
    <motion.div
      className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] items-center"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(14px)', transition: { duration: 0.4, ease: ease.inOut } }}
    >
      <div className="relative h-[46vh] lg:h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: ease.out }}
        >
          <ParticleSphere />
        </motion.div>
        <motion.div
          variants={staggerGroup}
          initial="hidden"
          animate="show"
          className="absolute inset-x-0 bottom-8 lg:bottom-16 px-8 lg:px-16 pointer-events-none"
        >
          <motion.div variants={item} className="flex items-center gap-2.5 mb-5">
            <span className="size-9 rounded-xl accent-gradient accent-glow grid place-items-center">
              <Sparkles className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">Vitrum CRM</span>
          </motion.div>
          <motion.h1 variants={item} className="text-3xl lg:text-[46px] font-semibold tracking-tight leading-[1.08] max-w-xl text-gradient-accent">
            Venda mais com um CRM que dá gosto de abrir.
          </motion.h1>
          <motion.div variants={item} className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Kanban, t: 'Funil visual' },
              { icon: CalendarDays, t: 'Agenda integrada' },
              { icon: Users, t: 'Multi-filial' },
            ].map(({ icon: I, t }) => (
              <span key={t} className="glass-subtle h-9 px-3.5 rounded-full inline-flex items-center gap-2 text-xs font-medium">
                <I className="size-3.5 text-accent-text" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="px-5 py-10 lg:py-0 flex justify-center">
        <motion.form
          onSubmit={entrar}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: ease.out, delay: 0.25 }}
          className="glass w-full max-w-[440px] rounded-[30px] p-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-sm text-muted mt-1 mb-7">Entre para acessar seu espaço de trabalho.</p>

          <div className="space-y-4">
            <Field label="E-mail">
              <Input icon={Mail} type="email" placeholder="voce@empresa.com.br" autoComplete="off" />
            </Field>
            <Field label="Senha">
              <Input
                icon={Lock}
                type={ver ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="off"
                right={
                  <button
                    type="button"
                    onClick={() => setVer((v) => !v)}
                    aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
                    className="size-8 grid place-items-center rounded-lg text-subtle hover:text-fg"
                  >
                    {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
            </Field>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs">
            <label className="inline-flex items-center gap-2 text-muted cursor-pointer">
              <input type="checkbox" defaultChecked className="size-4 rounded accent-[var(--accent)]" />
              Manter conectado
            </label>
            <button type="button" className="text-accent-text font-medium hover:underline">
              Esqueci a senha
            </button>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full justify-center mt-6" disabled={carregando}>
            {carregando ? (
              <motion.span
                className="size-5 rounded-full border-2 border-current border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
            ) : (
              <>
                Entrar <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 my-6 text-[11px] uppercase tracking-wider text-subtle">
            <span className="flex-1 h-px bg-[var(--line)]" />
            ou continue com
            <span className="flex-1 h-px bg-[var(--line)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button className="justify-center" onClick={() => entrar({ preventDefault() {} } as FormEvent)}>
              Google
            </Button>
            <Button className="justify-center" onClick={() => entrar({ preventDefault() {} } as FormEvent)}>
              Microsoft
            </Button>
          </div>
          <p className="text-center text-xs text-muted mt-6">
            Protótipo: qualquer clique em <span className="font-semibold text-fg">Entrar</span> abre o sistema.
          </p>
        </motion.form>
      </div>
    </motion.div>
  );
}
