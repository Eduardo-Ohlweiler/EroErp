import { AtSign, BriefcaseBusiness, HeartHandshake, MapPin, Mail, Phone, Shapes, Tag } from 'lucide-react';
import type { ItemMenu } from '../../design-system/shell';
import type { RecursoAuxiliar } from '../../shared/api/auxiliares';

/**
 * As 8 telas dos cadastros auxiliares (docs/04-permissoes.md, grupo CADASTROS_AUXILIARES), na ordem do submenu.
 * Uma fonte só para o menu (`app/menu.ts`), o redirecionamento de `/cadastros/auxiliares` e as rotas.
 */
export const RAIZ_DOS_AUXILIARES = '/cadastros/auxiliares';

export type TelaAuxiliar = ItemMenu & { tela: string; recurso: RecursoAuxiliar; descricao: string };

export const TELAS_AUXILIARES: TelaAuxiliar[] = [
  {
    tela: 'tipo-cadastro-formlist',
    recurso: 'tipos-cadastro',
    to: `${RAIZ_DOS_AUXILIARES}/tipos-de-cadastro`,
    label: 'Tipos de cadastro',
    icon: Tag,
    descricao: 'Cliente, fornecedor, lead e os seus próprios tipos de pessoa.',
  },
  {
    tela: 'tipo-telefone-formlist',
    recurso: 'tipos-telefone',
    to: `${RAIZ_DOS_AUXILIARES}/tipos-de-telefone`,
    label: 'Tipos de telefone',
    icon: Phone,
    descricao: 'Celular, WhatsApp, comercial e os seus próprios tipos.',
  },
  {
    tela: 'tipo-email-formlist',
    recurso: 'tipos-email',
    to: `${RAIZ_DOS_AUXILIARES}/tipos-de-email`,
    label: 'Tipos de e-mail',
    icon: Mail,
    descricao: 'Particular, comercial e os seus próprios tipos.',
  },
  {
    tela: 'tipo-endereco-formlist',
    recurso: 'tipos-endereco',
    to: `${RAIZ_DOS_AUXILIARES}/tipos-de-endereco`,
    label: 'Tipos de endereço',
    icon: MapPin,
    descricao: 'Residencial, comercial, cobrança e os seus próprios tipos.',
  },
  {
    tela: 'tipo-rede-social-formlist',
    recurso: 'tipos-rede-social',
    to: `${RAIZ_DOS_AUXILIARES}/tipos-de-rede-social`,
    label: 'Tipos de rede social',
    icon: AtSign,
    descricao: 'Instagram, LinkedIn e os seus próprios tipos.',
  },
  {
    tela: 'estado-civil-formlist',
    recurso: 'estados-civis',
    to: `${RAIZ_DOS_AUXILIARES}/estados-civis`,
    label: 'Estados civis',
    icon: HeartHandshake,
    descricao: 'Solteiro, casado, união estável e os seus próprios.',
  },
  {
    tela: 'profissao-formlist',
    recurso: 'profissoes',
    to: `${RAIZ_DOS_AUXILIARES}/profissoes`,
    label: 'Profissões',
    icon: BriefcaseBusiness,
    descricao: 'Autônomo, empresário e as profissões que você usa.',
  },
  {
    tela: 'categoria-servico-formlist',
    recurso: 'categorias-servico',
    to: `${RAIZ_DOS_AUXILIARES}/categorias-de-servico`,
    label: 'Categorias de serviço',
    icon: Shapes,
    descricao: 'Agrupe os serviços como o seu negócio fala.',
  },
];
