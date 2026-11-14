import { describe, expect, it } from 'vitest';
import { naVisaoDePlataforma } from '../shared/sessao/rotulos';
import { menuAdministrativo, tituloDaRota } from './menu';

describe('grupo Administrativo do menu', () => {
  it('só o superadmin na visão de plataforma vê Contratantes', () => {
    expect(menuAdministrativo({ papel: 'SUPERADMIN', superadminAtuando: false }).map((i) => i.to)).toEqual(['/admin/contratantes']);
    expect(menuAdministrativo({ papel: 'SUPERADMIN', superadminAtuando: true })).toEqual([]);
    expect(menuAdministrativo({ papel: 'ADMIN', superadminAtuando: false })).toEqual([]);
    expect(menuAdministrativo({ papel: 'USUARIO', superadminAtuando: false })).toEqual([]);
  });

  it('o mesmo critério guarda as rotas (SoPlataforma)', () => {
    expect(naVisaoDePlataforma({ papel: 'SUPERADMIN', superadminAtuando: false })).toBe(true);
    expect(naVisaoDePlataforma({ papel: 'SUPERADMIN', superadminAtuando: true })).toBe(false);
    expect(naVisaoDePlataforma({ papel: 'ADMIN', superadminAtuando: false })).toBe(false);
  });

  it('a barra superior chama todas as telas do cadastro de Contratantes', () => {
    expect(tituloDaRota('/admin/contratantes')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/novo')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantes/abc/aparencia')).toBe('Contratantes');
    expect(tituloDaRota('/admin/contratantesx')).toBe('Início');
  });
});
