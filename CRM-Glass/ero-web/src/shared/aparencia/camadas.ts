import { PADRAO_SISTEMA, type Settings, type Theme } from './mapear';

/**
 * Camadas da aparência, de baixo para cima (a de cima vence):
 *   1. padrão do sistema  (sempre; é o que vale na tela de login)
 *   2. contratante        (`usuario.aparencia`: fundo, destaque, vidro, animações, desempenho e o tema padrão)
 *   3. tema do usuário    (`usuario.temaPreferido`; só o tema, `null` segue o contratante)
 *   4. prévia             (temporária: tela Aparência do contratante, catálogo do design system)
 */
export type Camadas = {
  contratante: Partial<Settings> | null;
  temaDoUsuario: Theme | null;
  previa: Partial<Settings> | null;
};

/** Aparência pedida pelas camadas. */
export function combinarCamadas({ contratante, temaDoUsuario, previa }: Camadas): Settings {
  return { ...PADRAO_SISTEMA, ...contratante, ...(temaDoUsuario ? { theme: temaDoUsuario } : null), ...previa };
}

/** Tema sem a prévia (o que o usuário vê fora da tela de Aparência): é o que o botão claro/escuro alterna. */
export function temaSemPrevia({ contratante, temaDoUsuario }: Omit<Camadas, 'previa'>): Theme {
  return temaDoUsuario ?? contratante?.theme ?? PADRAO_SISTEMA.theme;
}
