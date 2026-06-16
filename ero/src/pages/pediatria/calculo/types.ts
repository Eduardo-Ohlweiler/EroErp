// Tipos compartilhados do módulo Pediatria (cálculo nutricional).

export type Sexo = "M" | "F"

export interface FormulaLacteaOption {
  id: number
  nome: string
  kcalPor100ml: number
  proteinaPor100ml: number
}

export interface EntradaPediatrica {
  sexo: Sexo
  idadeMeses: number | null
  pesoKg: number | null
  estaturaCm: number | null
  // Dieta prescrita (opcional)
  kcalPor100ml?: number | null
  proteinaPor100ml?: number | null
  volumeMl?: number | null
  frequenciaHoras?: number | null
}

export interface ResultadoPediatrico {
  imc: number | null
  // Estado nutricional (OMS)
  classifPesoIdade: string | null
  classifEstaturaIdade: string | null
  classifImcIdade: string | null
  // Necessidades nutricionais (DRIs)
  vet: number | null                 // kcal/dia
  proteinaNecessidade: number | null // g/dia
  // Dieta prescrita
  vezesDia: number | null
  volumeTotal: number | null         // ml/dia
  caloriasTotais: number | null      // kcal/dia
  proteinaTotal: number | null       // g/dia
  percCalorico: number | null        // %
  percProteico: number | null        // %
}
