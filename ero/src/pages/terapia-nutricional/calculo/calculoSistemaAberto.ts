// Cálculo da dieta artesanal modular (aba "TNE Sistema aberto" da planilha).
// Fidelidade à planilha é o requisito #1. Função pura — frontend only.

// ── Composição por módulo (kcal, cho, ptn, lip por unidade de medida) ────────────

export const MODULOS = {
  trophic:  { label: "Trophic basic pó",   unidade: "medida (7,8 g)",  kcal: 33.93, cho: 4.68, ptn: 1.24, lip: 1.09 },
  carbodex: { label: "Carbodex",           unidade: "medida (10 g)",   kcal: 40,    cho: 10,   ptn: 0,    lip: 0    },
  albumix:  { label: "Albumix power",      unidade: "medidor (20 g)",  kcal: 70,    cho: 1.5,  ptn: 16,   lip: 0    },
  oleo:     { label: "Óleo de soja",       unidade: "colher (13 ml)",  kcal: 108,   cho: 0,    ptn: 0,    lip: 12   },
} as const

export interface EntradaSistemaAberto {
  vet:              number | null   // kcal/dia desejada
  peso:             number | null   // kg
  dosesTrophic?:    number | null   // nº de doses (se vazio, sugere)
  dosesCarbodex:    number | null   // nº de medidas
  medidoresAlbumix: number | null   // nº de medidores
  colheresOleo:     number | null   // nº de colheres
}

export interface ResultadoSistemaAberto {
  // doses utilizadas
  dosesTrophic:   number | null
  // macros (g/dia)
  trophicCho:     number | null
  carbodexCho:    number | null
  albumixCho:     number | null
  trophicPtn:     number | null
  albumixPtn:     number | null
  trophicLip:     number | null
  oleoLip:        number | null
  choTotal:       number | null
  ptnTotal:       number | null
  lipTotal:       number | null
  // energia
  kcalBase:       number | null
  kcalTotal:      number | null
  kcalKg:         number | null
  ptnKg:          number | null
  // distribuição calórica
  percCho:        number | null
  percPtn:        number | null
  percLip:        number | null
  // água
  agua:           number | null   // ml/dia
  aguaPorDose4:   number | null   // ml por administração (4x/dia)
  // latas / embalagens estimadas (mês)
  latasTrophic:   number | null
  latasCarbodex:  number | null
  latasAlbumix:   number | null
  latasOleo:      number | null
  // receita por administração (÷ 4)
  receitaTrophic:  number | null
  receitaCarbodex: number | null
  receitaAlbumix:  number | null
  receitaOleo:     number | null
}

const VAZIO: ResultadoSistemaAberto = {
  dosesTrophic: null,
  trophicCho: null, carbodexCho: null, albumixCho: null,
  trophicPtn: null, albumixPtn: null,
  trophicLip: null, oleoLip: null,
  choTotal: null, ptnTotal: null, lipTotal: null,
  kcalBase: null, kcalTotal: null, kcalKg: null, ptnKg: null,
  percCho: null, percPtn: null, percLip: null,
  agua: null, aguaPorDose4: null,
  latasTrophic: null, latasCarbodex: null, latasAlbumix: null, latasOleo: null,
  receitaTrophic: null, receitaCarbodex: null, receitaAlbumix: null, receitaOleo: null,
}

export function calcularSistemaAberto(e: EntradaSistemaAberto): ResultadoSistemaAberto {
  const vet              = e.vet ?? null
  const peso             = e.peso ?? null
  const dosesCarbodex    = e.dosesCarbodex ?? 0
  const medidoresAlbumix = e.medidoresAlbumix ?? 0
  const colheresOleo     = e.colheresOleo ?? 0

  if (vet == null || vet <= 0) return { ...VAZIO }

  // Óleo (lipídio em g) e nº de doses de Trophic.
  const oleoLipG = colheresOleo * 12

  let doses: number
  if (e.dosesTrophic != null && e.dosesTrophic > 0) {
    doses = e.dosesTrophic
  } else {
    // sugestão: 85% do VET (descontado o óleo) coberto pelo Trophic.
    doses = ((vet - oleoLipG * 9) / MODULOS.trophic.kcal) * 0.85
  }

  // CHO (g/dia)
  const trophicCho  = doses * MODULOS.trophic.cho
  const carbodexCho = dosesCarbodex * MODULOS.carbodex.cho
  const albumixCho  = medidoresAlbumix * MODULOS.albumix.cho

  // PTN (g/dia)
  const trophicPtn = doses * MODULOS.trophic.ptn
  const albumixPtn = medidoresAlbumix * MODULOS.albumix.ptn

  // LIP (g/dia)
  const trophicLip = doses * MODULOS.trophic.lip
  const albumixLip = 0
  const oleoLip    = oleoLipG

  // Totais de macro
  const choTotal = trophicCho + albumixCho + carbodexCho
  const ptnTotal = trophicPtn + albumixPtn
  const lipTotal = trophicLip + albumixLip + oleoLip

  // Energia
  const kcalBase  = ptnTotal * 4 + (albumixCho + trophicCho) * 4 + lipTotal * 9
  const kcalTotal = kcalBase + dosesCarbodex * MODULOS.carbodex.kcal
  const kcalKg    = peso != null && peso > 0 ? kcalTotal / peso : null
  const ptnKg     = peso != null && peso > 0 ? ptnTotal / peso : null

  // Distribuição calórica (% do VET)
  const percCho = (choTotal * 4) * 100 / vet
  const percPtn = (ptnTotal * 4) * 100 / vet
  const percLip = (lipTotal * 9) * 100 / vet

  // Água
  const agua         = 28.5 * doses + 100 + dosesCarbodex * 100
  const aguaPorDose4 = agua / 4

  // Latas / embalagens estimadas (fator 31 dias)
  const latasTrophic  = (doses * 7.8 / 800) * 31
  const latasCarbodex = (dosesCarbodex * 10 / 500) * 31
  const latasAlbumix  = (medidoresAlbumix * 20 / 500) * 31
  const latasOleo     = (colheresOleo * 10 / 900) * 31

  // Receita por administração (÷ 4 — B26 da planilha)
  const receitaTrophic  = doses / 4
  const receitaCarbodex = dosesCarbodex / 4
  const receitaAlbumix  = medidoresAlbumix / 4
  const receitaOleo     = 13 / 4

  return {
    dosesTrophic: doses,
    trophicCho, carbodexCho, albumixCho,
    trophicPtn, albumixPtn,
    trophicLip, oleoLip,
    choTotal, ptnTotal, lipTotal,
    kcalBase, kcalTotal, kcalKg, ptnKg,
    percCho, percPtn, percLip,
    agua, aguaPorDose4,
    latasTrophic, latasCarbodex, latasAlbumix, latasOleo,
    receitaTrophic, receitaCarbodex, receitaAlbumix, receitaOleo,
  }
}
