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
import { TWindow } from "../../../components/twindow";
import { useState } from "react";
import { TDate } from "../../../components/tdate";
import { TFieldList } from "../../../components/tfieldlist";

export function PessoaList() {
  const navigate = useNavigate();
  const [openWindow, setOpenWindow] = useState(false);

  async function handleSubmit(data: Record<string, string>) {
    console.log("Form data:", data);
  }

  return (
    <TPage title="Nova Pessoa" breadcrumb={["Cadastros", "Pessoas"]}>
      <TForm onSubmit={console.log}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" />
          </TCol>
          <TCol>
            <TDate name="nascimento" label="Nascimento" />
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
          <TEntry name="data" label="Data" mask="data" width="220px" />
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

        <TFieldList
          name="itens"
          minRows={3}
          columns={[
            { label: "Produto",    name: "produto",    width: "30%" },
            { label: "Quantidade", name: "quantidade", width: "15%" },
            { label: "Valor",      name: "valor",      width: "20%" },
            {
              label: "Vencimento",
              name:  "vencimento",
              width: "20%",
              render: (rowIndex) => (
                <TDate name={`itens[${rowIndex}][vencimento]`} label="" />
              )
            },
            {
              label: "Status",
              name:  "status",
              width: "15%",
              render: (rowIndex) => (
                <TCombo
                  name    ={`itens[${rowIndex}][status]`}
                  label   =""
                  options ={[
                    { value: "A", label: "Ativo"   },
                    { value: "I", label: "Inativo" },
                  ]}
                />
              )
            },
          ]}
        />

        <TButton label="Abrir twindow" onClick={() => setOpenWindow(true)} />

        

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

      <TWindow
          title="Novo Registro"
          open={openWindow}
          onClose={() => setOpenWindow(false)}
          width="600px"
          actions={
            <>
              <TButton
                label="Cancelar"
                variant="cancel"
                onClick={() => setOpenWindow(false)}
              />
              <TButton
                label="Salvar"
                variant="save"
                type="submit"
                form="form-window"
              />
            </>
          }
        >
          <TForm id="form-window" onSubmit={handleSubmit}>
            {/* <TFieldList columns={2}>
            <TEntry name="nome" label="Nome" />
          </TFieldList> */}
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
          </TForm>
        </TWindow>
    </TPage>
    
  );
}
