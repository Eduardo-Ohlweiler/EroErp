import { useNavigate } from "react-router-dom"
import { TPage } from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../../components/tform"
import { TEntry } from "../../../components/tentry"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TButton } from "../../../components/tbutton"

export function PessoaList() {
  const navigate = useNavigate()

  return (
    <TPage title="Nova Pessoa" breadcrumb={["Cadastros", "Pessoas"]}>
      <TForm onSubmit={console.log}>

        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" required/>
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
          <TCol>
            <TEntry name="nome" label="Nome" disabled />
          </TCol>
          <TCol>
            <TEntry type="hidden" name="empty" label=""/>
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="idade" label="Idade" width="120px" />
          </TCol>
          <TCol>
            <TEntry name="idade" label="Idade" width="120px" />
          </TCol>
          <TCol>
            <TEntry type="hidden" name="empty" label=""/>
          </TCol>
        </TRow>

        <TFormFooter>

          <TFormActionsLeft>
            <TButton
              label="Voltar"
              variant="secondary"
              onClick={() => navigate(-1)}
            />
          </TFormActionsLeft>

          <TFormActionsRight>
            <TButton
              label="Limpar"
              variant="secondary"
              type="reset"
            />

            <TButton
              label="Salvar"
              type="submit"
              variant="primary"
            />
          </TFormActionsRight>

        </TFormFooter>

      </TForm>
    </TPage>
  )
}