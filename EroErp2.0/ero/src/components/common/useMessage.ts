import { toast } from 'react-toastify'
import { handleApiError } from '@/services/api'

/**
 * As mensagens da tela. O `react-toastify` fica por baixo; **a tela não
 * importa `toast`**. Sucesso, aviso e informação somem sozinhos; o erro fica
 * até o usuário fechar.
 */
const MENSAGENS = {
  sucesso: (texto: string) => {
    toast.success(texto)
  },
  erro: (texto: string) => {
    toast.error(texto, { autoClose: false })
  },
  aviso: (texto: string) => {
    toast.warning(texto)
  },
  info: (texto: string) => {
    toast.info(texto)
  },
  /** O tratamento padrão de erro de API (`handleApiError`) — para todo `catch`. */
  erroApi: (erro: unknown) => {
    handleApiError(erro)
  },
}

export type Mensagens = typeof MENSAGENS

/** O mesmo objeto a cada render: pode entrar em dependência de efeito sem laço. */
export function useMessage(): Mensagens {
  return MENSAGENS
}
