import { useNavigate } from "react-router-dom"
import { TPage } from "../../../components/tpage"
import { TForm } from "../../../components/tform"
import { TEntry } from "../../../components/tentry"
import { TButton } from "../../../components/tbutton"

// pages/cadastros/pessoas/PessoaForm.tsx
export function PessoaList() {
  const navigate = useNavigate()

  

  return (
    <TPage title="Nova Pessoa" breadcrumb={["Cadastros", "Pessoas"]}>
      <TForm onSubmit={console.log} columns={2}>
        <TEntry name="nome"  label="Nome"   required />
        <TEntry name="email" label="E-mail" type="email" />

        <div className="col-span-2 flex justify-end gap-2">
          <TButton label="Cancelar" variant="secondary" onClick={() => navigate(-1)} />
          <TButton label="Salvar" type="submit" loading={true}  />
        </div>
      </TForm>
    </TPage>
  )
}