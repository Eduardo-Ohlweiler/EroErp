export interface Pais {
    codigo: string
    nome:   string
    flag:   string
}

/**
 * Lista de países para seleção do código do país (DDI) em telefones.
 * `codigo` = apenas os dígitos do DDI (ex. "55"). Brasil sempre em primeiro.
 */
export const PAISES: Pais[] = [
    { codigo: "55",  nome: "Brasil",          flag: "🇧🇷" },
    { codigo: "351", nome: "Portugal",        flag: "🇵🇹" },
    { codigo: "1",   nome: "EUA / Canadá",    flag: "🇺🇸" },
    { codigo: "54",  nome: "Argentina",       flag: "🇦🇷" },
    { codigo: "595", nome: "Paraguai",        flag: "🇵🇾" },
    { codigo: "598", nome: "Uruguai",         flag: "🇺🇾" },
    { codigo: "56",  nome: "Chile",           flag: "🇨🇱" },
    { codigo: "591", nome: "Bolívia",         flag: "🇧🇴" },
    { codigo: "51",  nome: "Peru",            flag: "🇵🇪" },
    { codigo: "57",  nome: "Colômbia",        flag: "🇨🇴" },
    { codigo: "58",  nome: "Venezuela",       flag: "🇻🇪" },
    { codigo: "52",  nome: "México",          flag: "🇲🇽" },
    { codigo: "34",  nome: "Espanha",         flag: "🇪🇸" },
    { codigo: "44",  nome: "Reino Unido",     flag: "🇬🇧" },
    { codigo: "33",  nome: "França",          flag: "🇫🇷" },
    { codigo: "49",  nome: "Alemanha",        flag: "🇩🇪" },
    { codigo: "39",  nome: "Itália",          flag: "🇮🇹" },
    { codigo: "81",  nome: "Japão",           flag: "🇯🇵" },
    { codigo: "86",  nome: "China",           flag: "🇨🇳" },
    { codigo: "61",  nome: "Austrália",       flag: "🇦🇺" },
]

export const CODIGO_PAIS_PADRAO = "55"
