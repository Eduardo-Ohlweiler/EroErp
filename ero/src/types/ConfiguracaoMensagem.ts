export interface ConfiguracaoMensagem {
  id:                     number
  usuarioId:              number
  usuarioNome:            string
  cabecalhoAgendamento:   string | null
  rodapeAgendamento:      string | null
  cabecalhoLembrete:      string | null
  rodapeLembrete:         string | null
  cabecalhoCancelamento:  string | null
  rodapeCancelamento:     string | null
  cabecalhoConclusao:     string | null
  rodapeConclusao:        string | null
}
