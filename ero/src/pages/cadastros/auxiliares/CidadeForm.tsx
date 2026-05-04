import { useNavigate, useParams } from "react-router-dom"
import { useMessage } from "../../../hooks/useMessage";
import { useEffect, useState } from "react";
import type { Cidade } from "../../../types/Cidade";
import { api } from "../../../services/api";
import axios from "axios";
import type { ErrorResponse } from "../../../types/ErrorResponse";
import { TPage } from "../../../components/tpage";
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../../components/tform";
import { TButton } from "../../../components/tbutton";
import { TRow } from "../../../components/trow";
import { TCol } from "../../../components/tcol";
import { TEntry } from "../../../components/tentry";
import { TDbCombo } from "../../../components/tdbcombo";
import { TCombo } from "../../../components/tcombo";

export default function CidadeForm() {

    const { id: idParam } = useParams();
    const navigate        = useNavigate();
    const { showMessage } = useMessage();

    const [estadoId,  setEstadoId]  = useState("");
    const [currentId, setCurrentId] = useState<string | undefined>(idParam);
    const [formKey,   setFormKey]   = useState(0);
    const [loading,   setLoading]   = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [cidade,    setCidade]    = useState<Cidade | null>(null);

    const isEdit = !!currentId;

    useEffect(() => {
        if (!currentId) {
            setEstadoId("");
            return;
        }

        setLoading(true);
        api.get(`/cidades/${currentId}`)
            .then((response) => {
                setCidade(response.data);
                setEstadoId(String(response.data.estado.id)); // ← corrigido
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar cidade");
                navigate("/cidades");
            })
            .finally(() => setLoading(false));
    }, [currentId, navigate, showMessage])

    function handleNovo() {
        setCurrentId(undefined);
        setCidade(null);
        setEstadoId("");
        setFormKey((prev) => prev + 1);
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/cidades/${id}`) // ← corrigido
            setCidade(response.data)
            setEstadoId(String(response.data.estado.id))     // ← corrigido
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar a cidade")
        }
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true);
        try {
            const payload = {
                nome:       data.nome,
                estadoId:   Number(data.estadoId), // ← corrigido, era data.estado
                codigoIbge: Number(data.codigoIbge),
                ativo:      data.ativo === "true"
            }
            if (isEdit) {
                await api.patch(`/cidades/${currentId}`, payload);
                showMessage("success", "Cidade atualizada com sucesso!");
                await reload(currentId!);
            } else {
                const response = await api.post("/cidades", payload);
                showMessage("success", "Cidade cadastrada com sucesso!");
                const novoId = String(response.data.id)
                setCurrentId(novoId)
                await reload(novoId);
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar cidade")
            } else {
                showMessage("error", "Erro inesperado ao salvar cidade")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <TPage title="Carregando..." breadcrumb={["Cadastros", "Auxiliares", "Cidades"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title={isEdit ? "Editar Cidade" : "Nova Cidade"}
            breadcrumb={["Cadastros", "Auxiliares", "Cidades"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="nome"
                            label        ="Nome"
                            required
                            maxLength    ={150}
                            defaultValue ={cidade?.nome}
                            width        ="50%"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TDbCombo
                            name         ="estadoId"
                            label        ="Estado"
                            url          ="/estados/select"
                            valueField   ="id"
                            displayField ="nome"
                            searchField  ="nome"
                            width        ="50%"
                            required     ={!isEdit}
                            disabled     ={isEdit}
                            value        ={estadoId}
                            onChange     ={setEstadoId}
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TEntry
                            name         ="codigoIbge"
                            label        ="Código IBGE"
                            required
                            maxLength    ={7}
                            defaultValue ={cidade?.codigoIbge ? String(cidade.codigoIbge) : ""} // ← corrigido
                            width        ="150px"
                        />
                    </TCol>
                </TRow>
                <TRow>
                    <TCol>
                        <TCombo
                            name         ="ativo"
                            label        ="Status"
                            width        ="200px"
                            defaultValue ={cidade ? (cidade.ativo ? "true" : "false") : "true"}
                            options      ={[
                                { value: "true",  label: "Ativo"    },
                                { value: "false", label: "Bloqueado" },
                            ]}
                        />
                    </TCol>
                </TRow>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton label="Voltar" variant="cancel" onClick={() => navigate("/cidades")} />
                        <TButton label="Novo"   variant="new"    onClick={handleNovo} />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton label="Salvar" variant="save" type="submit" loading={saving} />
                    </TFormActionsRight>
                </TFormFooter>

            </TForm>
        </TPage>
    )
}