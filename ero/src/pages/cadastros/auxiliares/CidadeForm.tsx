import { useNavigate, useParams } from "react-router-dom"
import { useMessage } from "../../../hooks/useMessage";
import { useEffect, useState } from "react";
import type { Cidade } from "../../../types/Cidade";
import { api } from "../../../services/api";

export default function CidadeForm() {

    const { id: idParam } = useParams();
    const navigate        = useNavigate();
    const { showMessage } = useMessage();

    const [estadoId,    setEstadoId]    = useState("");
    const [currentId,   setCurrentId]   = useState<string | undefined>(idParam);
    const [formKey,     setFormKey]     = useState(0);
    const [loading,     setLoading]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [cidade,      setCidade]      = useState<Cidade | null>(null);

    const isEdit                        = !!currentId;

    useEffect(() => {
        if (!currentId) {
            setEstadoId("");
            return;
        }

        setLoading(true);
        api.get(`/cidades/${currentId}`)
            .then((response) => {
                setCidade(response.data);
                setEstadoId(String(response.data.estadoId));
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar cidade");
                navigate("/cidades");
            })
            .finally(() => setLoading(false));
    }, [currentId]);

    function handleNovo() {
        setCurrentId(undefined);
        setCidade(null);
        setEstadoId("");
        setFormKey((prev) => prev + 1);
    }

    async function handleSubmit(data: Record<string, string>) {
        setSaving(true);
        try {
            
        }
    }

    return (
        <div>
            <h1>Formulário de Cidade</h1>
            {/* Formulário para criar/editar cidade */}
        </div>
    )
}