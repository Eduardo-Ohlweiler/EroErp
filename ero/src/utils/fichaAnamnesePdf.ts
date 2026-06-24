import { api }                                      from "../services/api"
import type { FichaAnamneseResponse, TemplateAnamneseResponse } from "../types/Anamnese"
import { FINALIDADE_LABEL }                           from "./anamnese"
import { gerarPdfFichaAnamnese }                      from "./geradorPdf"
import type { DadosFichaAnamnese }                    from "./geradorPdf"

// Carrega a ficha e o seu template e monta a estrutura de seções esperada pelo
// gerador de PDF — mesma lógica de FichaAnamneseForm.montarDadosPdf.
export async function montarDadosPdfFicha(fichaId: number): Promise<DadosFichaAnamnese> {
    const fichaRes = await api.get<FichaAnamneseResponse>(`/fichas-anamnese/${fichaId}`)
    const ficha    = fichaRes.data

    const tmplRes  = await api.get<TemplateAnamneseResponse>(`/templates-anamnese/${ficha.templateId}`)
    const template = tmplRes.data

    const secoesSet = [...new Set(
        template.campos.filter(c => c.ativo).map(c => c.secao ?? "Geral")
    )].sort()

    const secoes = secoesSet.map(nomeSec => ({
        nome:   nomeSec,
        campos: template.campos
            .filter(c => c.ativo && (c.secao ?? "Geral") === nomeSec)
            .sort((a, b) => a.ordem - b.ordem)
            .map(c => {
                const resposta = ficha.respostas.find(r => r.campoId === c.id)
                return {
                    rotulo: c.rotulo,
                    tipo:   c.tipo,
                    valor:  resposta?.valor ?? null,
                }
            }),
    }))

    return {
        fichaId:           ficha.id,
        emitenteNome:      ficha.emitenteNome ?? "Clínica",
        finalidadeLabel:   FINALIDADE_LABEL[ficha.finalidade],
        templateNome:      ficha.templateNome,
        pessoaNome:        ficha.pessoaNome,
        pessoaDocumento:   ficha.pessoaDocumento,
        dataPreenchimento: ficha.dataPreenchimento,
        observacoes:       ficha.observacoes,
        secoes,
    }
}

// Gera o PDF da ficha e dispara o download no navegador.
export async function gerarEBaixarPdfFicha(fichaId: number): Promise<void> {
    const dados   = await montarDadosPdfFicha(fichaId)
    const base64  = gerarPdfFichaAnamnese(dados)
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${base64}`
    link.download = `ficha-anamnese-${fichaId}.pdf`
    link.click()
}
