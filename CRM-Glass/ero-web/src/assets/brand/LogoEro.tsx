import type { SVGProps } from 'react';

/*
 * O logo do Ero, o mesmo do EroErp 2.0 (os .svg desta pasta vieram de `EroErp2.0/ero/src/assets/brand/`).
 *
 * Inline em TSX porque o ero-web não tem svgr (`?react`): assim o desenho pega a cor de quem o usa. As letras
 * vão em `currentColor`; a barra do "e", as barras do gráfico, o arco e o traço vertical vão em `--logo-acento`
 * (sem ela, `currentColor`). Nunca um PNG de cor fixa: ele destoaria do destaque do contratante.
 *
 * Se o desenho mudar, mude o `.svg` e este arquivo juntos.
 */

const ACENTO = { fill: 'var(--logo-acento, currentColor)' } as const;

/** `logo-ero-horizontal.svg`: o "ero" com o "ERP" ao lado, "Ero ERP" (cabeçalho da folha impressa). No 2.0 o texto era "SISTEMA". */
export function LogoEroHorizontal({ titulo = 'Ero ERP', ...props }: SVGProps<SVGSVGElement> & { titulo?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 915 240" fill="currentColor" role="img" aria-label={titulo} {...props}>
      <g style={ACENTO}>
        <path d="M5 4H232Q247 4 241 18L236 30Q231 42 216 42H5Z" />
        <path d="M459 161L479 154V190H459Z" />
        <path d="M490 131L511 123V190H490Z" />
        <path d="M522 107L545 98V190H522Z" />
        <path d="M553.1 74.9A85 85 0 0 1 522.1 214.9" style={{ fill: 'none', stroke: 'var(--logo-acento, currentColor)' }} strokeWidth={30} />
        <rect x="638" y="70" width="5" height="130" rx="2.5" />
      </g>
      <path d="M5 105Q5 84 26 84H170Q190 84 190 104Q190 125 170 125H46V175H203Q215 175 215 187V203Q215 215 203 215H26Q5 215 5 194Z" />
      <path d="M235 215V102Q235 51 286 51H368Q388 51 388 71Q388 92 368 92H292Q278 92 278 106V215Z" />
      <path d="M532.9 60.0A85 85 0 1 0 522.1 214.9" fill="none" stroke="currentColor" strokeWidth={30} />
      <text x="690" y="163" fontFamily="inherit" fontSize="80" fontWeight="500" textLength="220" lengthAdjust="spacing">
        ERP
      </text>
    </svg>
  );
}

/** `logo-ero-simbolo.svg`: só o "e" com a barra de acento (espaço estreito). */
export function LogoEroSimbolo({ titulo = 'Ero ERP', ...props }: SVGProps<SVGSVGElement> & { titulo?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 220" fill="currentColor" role="img" aria-label={titulo} {...props}>
      <path style={ACENTO} d="M5 4H232Q247 4 241 18L236 30Q231 42 216 42H5Z" />
      <path d="M5 105Q5 84 26 84H170Q190 84 190 104Q190 125 170 125H46V175H203Q215 175 215 187V203Q215 215 203 215H26Q5 215 5 194Z" />
    </svg>
  );
}
