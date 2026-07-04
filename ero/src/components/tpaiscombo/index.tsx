import { TCombo } from "../tcombo"
import { PAISES, CODIGO_PAIS_PADRAO } from "../../constants/paises"

interface TPaisComboProps {
    name:          string
    label?:        string
    width?:        string
    defaultValue?: string
    onChange?:     (value: string) => void
}

/**
 * Combo de seleção do código do país (DDI) para telefones.
 * Wrapper fino sobre TCombo — monta as opções a partir de PAISES.
 * value = código do DDI (ex. "55"); default "55" (Brasil).
 */
export function TPaisCombo({
    name,
    label        = "País",
    width        = "200px",
    defaultValue = CODIGO_PAIS_PADRAO,
    onChange
}: TPaisComboProps) {
    return (
        <TCombo
            name         ={name}
            label        ={label}
            width        ={width}
            defaultValue ={defaultValue}
            onChange     ={onChange}
            options      ={PAISES.map(p => ({
                value: p.codigo,
                label: `${p.flag} ${p.nome} (+${p.codigo})`,
            }))}
        />
    )
}
