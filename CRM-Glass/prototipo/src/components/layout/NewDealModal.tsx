import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, CalendarDays, CircleDollarSign, Handshake, Type } from 'lucide-react';
import { useStore } from '../../store';
import { ETAPAS, VENDEDORES, type Etapa } from '../../data/mock';
import { spring } from '../../motion/tokens';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Avatar, Field, Input, Segmented } from '../ui/Bits';
import { CloseButton, Modal } from '../ui/Overlays';
import { useToast } from '../ui/Toast';

/** Formulário de novo negócio: mostra o padrão visual de formulário, validação e feedback. */
export function NewDealModal() {
  const { newDealOpen: open, setNewDealOpen: setOpen, addDeal } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [empresa, setEmpresa] = useState('');
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [etapa, setEtapa] = useState<Etapa>('prospeccao');
  const [previsao, setPrevisao] = useState('');
  const [resp, setResp] = useState(VENDEDORES[0]);
  const [tentou, setTentou] = useState(false);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (open) {
      setEmpresa('');
      setTitulo('');
      setValor('');
      setEtapa('prospeccao');
      setPrevisao('');
      setResp(VENDEDORES[0]);
      setTentou(false);
    }
  }, [open]);

  const erros = { empresa: !empresa.trim() ? 'Informe a empresa.' : '', titulo: !titulo.trim() ? 'Dê um nome ao negócio.' : '' };
  const valido = !erros.empresa && !erros.titulo;

  function salvar() {
    setTentou(true);
    if (!valido) {
      setShake((s) => s + 1);
      return;
    }
    const num = Number(valor.replace(/\D/g, '')) || 0;
    addDeal({
      id: `n${Date.now()}`,
      titulo: titulo.trim(),
      cliente: empresa.trim(),
      valor: num,
      etapa,
      prob: etapa === 'ganho' ? 100 : 20,
      responsavel: resp,
      previsao: previsao ? new Date(`${previsao}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'sem data',
      tags: ['Novo'],
      origem: 'Manual',
    });
    setOpen(false);
    toast({ title: 'Negócio criado', description: `${titulo.trim()} entrou em ${ETAPAS.find((e) => e.id === etapa)?.nome}.`, tone: 'success' });
    if (pathname !== '/funil') nav('/funil');
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Novo negócio" width={600}>
      <motion.div
        initial={false}
        animate={{ x: shake % 2 ? [0, -10, 9, -6, 4, 0] : [0, 10, -9, 6, -4, 0] }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 p-6 pb-4">
          <span className="size-11 rounded-2xl accent-gradient accent-glow grid place-items-center">
            <Handshake className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Novo negócio</h2>
            <p className="text-xs text-muted">Preencha o essencial — o resto pode vir depois.</p>
          </div>
          <CloseButton onClick={() => setOpen(false)} />
        </div>

        <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Empresa" error={tentou ? erros.empresa : undefined}>
            <Input icon={Building2} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex.: Agro Vale Sul" invalid={tentou && !!erros.empresa} autoFocus />
          </Field>
          <Field label="Nome do negócio" error={tentou ? erros.titulo : undefined}>
            <Input icon={Type} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Usina solar 120 kWp" invalid={tentou && !!erros.titulo} />
          </Field>
          <Field label="Valor estimado" hint="Somente números">
            <Input
              icon={CircleDollarSign}
              value={valor}
              inputMode="numeric"
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, '');
                setValor(n ? Number(n).toLocaleString('pt-BR') : '');
              }}
              placeholder="0"
            />
          </Field>
          <Field label="Previsão de fechamento">
            <Input icon={CalendarDays} type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Etapa">
              <Segmented
                className="flex flex-wrap"
                options={ETAPAS.map((e) => ({ value: e.id, label: e.nome }))}
                value={etapa}
                onChange={setEtapa}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Responsável">
              <div className="flex flex-wrap gap-2">
                {VENDEDORES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setResp(v)}
                    className={cn(
                      'relative flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full text-xs font-medium transition-colors',
                      resp === v ? 'text-fg' : 'chip text-muted hover:text-fg',
                    )}
                  >
                    {resp === v && (
                      <motion.span
                        layoutId="resp-active"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-full border border-accent/50 bg-accent/12"
                      />
                    )}
                    <span className="relative">
                      <Avatar name={v} size={28} />
                    </span>
                    <span className="relative">{v.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-5">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvar}>
            Criar negócio
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
