import { useNavigate } from "react-router-dom";
import { TPage } from "../../../components/tpage";
import {
  TForm,
  TFormActionsLeft,
  TFormActionsRight,
  TFormFooter,
} from "../../../components/tform";
import { TEntry } from "../../../components/tentry";
import { TRow } from "../../../components/trow";
import { TCol } from "../../../components/tcol";
import { TButton } from "../../../components/tbutton";
import { TSpace } from "../../../components/tspace";
import { TRadio } from "../../../components/tradio";
import { TCombo } from "../../../components/tcombo";
import { TCheckbox } from "../../../components/tcheckbox";
import { TText } from "../../../components/ttext";
import { TDbCombo } from "../../../components/tdbcombo";
import { TUniqueSearch } from "../../../components/tuniquesearch";
import { TDbCheckbox } from "../../../components/tdbcheckbox";
import { TDbRadio } from "../../../components/tdbradio";

export function PessoaList() {
  const navigate = useNavigate();

  return (
    <TPage title="Nova Pessoa" breadcrumb={["Cadastros", "Pessoas"]}>
      <TForm onSubmit={console.log}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" required />
          </TCol>
          <TCol>
            <TEntry name="nome" label="Nome" required />
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
            <TSpace />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry name="idade" label="Idade" width="120px" />
          </TCol>
          <TCol>
            <TSpace />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TEntry name="cpf" label="CPF" mask="cpf" width="220px" />
          </TCol>
        </TRow>
        <TRow>
          <TEntry name="celular" label="Celular" mask="celular" width="220px" />
        </TRow>
        <TRow>
          <TEntry name="cep" label="CEP" mask="cep" width="220px" />
        </TRow>
        <TRow>
          <TEntry name="valor" label="Valor" mask="moeda" width="220px" />
        </TRow>
        <TRow>
          <TEntry
            name="obs"
            label="Obs"
            maxLength={200}
            hint="Máximo 200 caracteres"
          />
        </TRow>

        <TRow>
          <TCol>
            <TCombo
              name="estado"
              label="Estado"
              options={[
                { value: "RS", label: "Rio Grande do Sul" },
                { value: "SP", label: "São Paulo" },
              ]}
            />
          </TCol>
          <TCol>
            <TRadio
              name="tipo"
              label="Tipo"
              direction="column"
              options={[
                { value: "F", label: "Física" },
                { value: "J", label: "Jurídica" },
              ]}
              defaultValue="F"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TRadio
              name="tipo"
              label="Tipo"
              options={[
                { value: "F", label: "Física" },
                { value: "J", label: "Jurídica" },
                { value: "J", label: "Outros" },
              ]}
              defaultValue="F"
            />
          </TCol>
        </TRow>

        <TCheckbox
          name="dias"
          label="Dias de funcionamento"
          direction="row"
          defaultValues={["seg", "ter"]}
          options={[
            { value: "seg", label: "Segunda" },
            { value: "ter", label: "Terça" },
            { value: "qua", label: "Quarta" },
            { value: "qui", label: "Quinta" },
            { value: "sex", label: "Sexta" },
          ]}
          onChange={(values) => console.log(values)}
        />

        <TCheckbox
          name="dias"
          label="Dias de funcionamento"
          direction="column"
          defaultValues={["seg", "ter"]}
          options={[
            { value: "seg", label: "Segunda" },
            { value: "ter", label: "Terça" },
            { value: "qua", label: "Quarta" },
            { value: "qui", label: "Quinta" },
            { value: "sex", label: "Sexta" },
          ]}
          onChange={(values) => console.log(values)}
        />

        <TText
          name="observacao"
          label="Observação:"
          placeholder="Digite aqui..."
          maxLength={500}
          height="150px"
          hint="Campo opcional"
          resize="vertical"
        />

        <TRow>
          <TCol>
            <TDbCombo
              name="clienteId"
              label="Cliente"
              url="/clientes"
              valueField="id"
              displayField="nome"
              searchField="nome"
              minLength={2}
            />
          </TCol>
          <TCol>
            <TDbCombo
              name="clienteId"
              label="Cliente"
              url="/clientes"
              valueField="id"
              displayField={(item) => `${item.nome} (${item.email})`}
              searchField="nome"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TUniqueSearch
              name="clienteId"
              label="Cliente"
              url="/clientes"
              valueField="id"
              displayField={(item) => `${item.nome} (${item.email})`}
              searchField="nome"
              minLength={2}
              onChange={(value, item) => console.log(value, item)}
              width="80%"
            />
          </TCol>
        </TRow>
        <TDbCheckbox
          name="roleIds"
          label="Perfis de acesso"
          url="/roles"
          valueField="id"
          labelField="nome"
          direction="row"
        />

        <TDbRadio
          name="roleId"
          label="Perfil principal"
          url="/roles"
          valueField="id"
          labelField="nome"
        />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton
              label="Voltar"
              variant="secondary"
              onClick={() => navigate(-1)}
            />
          </TFormActionsLeft>

          <TFormActionsRight>
            <TButton label="Limpar" variant="secondary" type="reset" />

            <TButton label="Salvar" type="submit" variant="primary" />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  );
}
